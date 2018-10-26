// == load some modules ========================================================
import Xorshift from '../libs/xorshift';
import UltraCat from '../libs/ultracat';

// == roll the dice ============================================================
const seed = 15881342356;
let xorshift = new Xorshift( seed );

// == very basic constants =====================================================
const ppp = 2;
const nParticleSqrt = 64;
const nParticle = nParticleSqrt * nParticleSqrt;

export default ( context ) => {
  // == prepare context ========================================================
  const glCatPath = context.glCatPath;
  const glCat = glCatPath.glCat;
  const gl = glCat.gl;

  const auto = context.automaton.auto;

  // == prepare vbos ===========================================================
  const vboQuad = glCat.createVertexbuffer( new Float32Array( UltraCat.triangleStripQuad ) );

  const vboComputeUV = glCat.createVertexbuffer( new Float32Array(
    UltraCat.matrix2d( nParticleSqrt, nParticleSqrt ).map( ( v, i ) => (
      i % 2 === 0
        ? ( v * ppp + 0.5 ) / nParticleSqrt / ppp
        : ( v + 0.5 ) / nParticleSqrt
    ) )
  ) );

  // == prepare random texture =================================================
  const textureRandomSize = 32;
  const textureRandomUpdate = ( _tex ) => {
    glCat.setTextureFromArray( _tex, textureRandomSize, textureRandomSize, ( () => {
      let len = textureRandomSize * textureRandomSize * 4;
      let ret = new Uint8Array( len );
      for ( let i = 0; i < len; i ++ ) {
        ret[ i ] = Math.floor( xorshift.gen() * 256.0 );
      }
      return ret;
    } )() );
  };

  const textureRandomStatic = glCat.createTexture();
  glCat.textureWrap( textureRandomStatic, gl.REPEAT );
  textureRandomUpdate( textureRandomStatic );

  const textureRandom = glCat.createTexture();
  glCat.textureWrap( textureRandom, gl.REPEAT );

  // == Toby Fox - Dummy! ======================================================
  const textureDummy = glCat.createTexture();
  glCat.setTextureFromArray( textureDummy, 1, 1, new Uint8Array( [ 0, 0, 0, 0 ] ) );

  // == let's create paths =====================================================
  glCatPath.add( {
    // == framebuffer sucks ====================================================
    particlesComputeReturn: {
      width: nParticleSqrt * ppp,
      height: nParticleSqrt,
      vert: require( '../shaders/quad.vert' ),
      frag: require( '../shaders/return.frag' ),
      blend: [ gl.ONE, gl.ZERO ],
      clear: [ 0.0, 0.0, 0.0, 0.0 ],
      framebuffer: true,
      float: true,
      func: ( path, params ) => {
        if ( context.automaton.time === 0.0 ) {
          xorshift.set( seed );
        }

        glCat.attribute( 'p', vboQuad, 2 );
        glCat.uniformTexture( 'sampler0', glCatPath.fb( 'particlesCompute' ).texture, 0 );
        gl.drawArrays( gl.TRIANGLE_STRIP, 0, 4 );
      }
    },

    // == compute particles =======================================================
    particlesCompute: {
      width: nParticleSqrt * ppp,
      height: nParticleSqrt,
      vert: require( '../shaders/quad.vert' ),
      frag: require( '../shaders/particles-compute.frag' ),
      blend: [ gl.ONE, gl.ZERO ],
      clear: [ 0.0, 0.0, 0.0, 0.0 ],
      framebuffer: true,
      float: true,
      func: ( path, params ) => {
        textureRandomUpdate( textureRandom );

        glCat.attribute( 'p', vboQuad, 2 );

        glCat.uniform1f( 'nParticle', nParticle );
        glCat.uniform1f( 'nParticleSqrt', nParticleSqrt );
        glCat.uniform1f( 'ppp', ppp );

        glCat.uniformTexture( 'samplerPcompute', glCatPath.fb( 'particlesComputeReturn' ).texture, 0 );
        glCat.uniformTexture( 'samplerRandom', textureRandom, 1 );
        glCat.uniformTexture( 'samplerRandomStatic', textureRandomStatic, 2 );

        glCat.uniform1f( 'noisePhase', auto( 'particles-noisePhase' ) );
        glCat.uniform1f( 'genRate', auto( 'particles-genRate' ) );

        gl.drawArrays( gl.TRIANGLE_STRIP, 0, 4 );
      }
    },

    // == render particles =====================================================
    particlesRender: {
      vert: require( '../shaders/particles-render.vert' ),
      frag: require( '../shaders/particles-render.frag' ),
      blend: [ gl.ONE, gl.ZERO ],
      drawbuffers: 3,
      func: ( path, params ) => {
        glCat.attribute( 'computeUV', vboComputeUV, 2 );

        glCat.uniform1f( 'nParticle', nParticle );
        glCat.uniform1f( 'nParticleSqrt', nParticleSqrt );
        glCat.uniform1f( 'ppp', ppp );

        glCat.uniform2fv( 'resolutionPcompute', [ nParticleSqrt * ppp, nParticleSqrt ] );

        glCat.uniform1i( 'isShadow', params.isShadow ? 1 : 0 );

        glCat.uniform1f( 'colorVar', auto( 'particles-colorVar' ) );
        glCat.uniform1f( 'colorOffset', auto( 'particles-colorOffset' ) );

        glCat.uniformTexture( 'samplerPcompute', glCatPath.fb( 'particlesCompute' ).texture, 0 );
        glCat.uniformTexture( 'samplerRandom', textureRandom, 1 );
        glCat.uniformTexture( 'samplerRandomStatic', textureRandomStatic, 2 );
        glCat.uniformTexture( 'samplerShadow', params.textureShadow || textureDummy, 3 );

        gl.drawArrays( gl.POINTS, 0, nParticle );
      }
    },
  } );

  if ( module.hot ) {
    module.hot.accept(
      [
        '../shaders/quad.vert',
        '../shaders/particles-compute.frag'
      ],
      () => {
        glCatPath.replaceProgram(
          'particlesCompute',
          require( '../shaders/quad.vert' ),
          require( '../shaders/particles-compute.frag' )
        );
      }
    );

    module.hot.accept(
      [
        '../shaders/particles-render.vert',
        '../shaders/particles-render.frag'
      ],
      () => {
        glCatPath.replaceProgram(
          'particlesRender',
          require( '../shaders/particles-render.vert' ),
          require( '../shaders/particles-render.frag' )
        );
      }
    );
  }
};