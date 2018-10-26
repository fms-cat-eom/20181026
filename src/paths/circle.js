import Xorshift from '../libs/xorshift.js';
import MathCat from '../libs/mathcat.js';

export default ( context ) => {
  // == hi context =============================================================
  const glCatPath = context.glCatPath;
  const glCat = glCatPath.glCat;
  const gl = glCat.gl;

  const width = context.width;
  const height = context.height;

  const auto = context.automaton.auto;

  // == hi vbo =================================================================
  const circle = require( '../geoms/circle.js' )( {
    radius: 1.0,
    hole: 0.8
  } );
  const vboPos = glCat.createVertexbuffer( circle.position );
  const vboUv = glCat.createVertexbuffer( circle.uv );
  const vboNor = glCat.createVertexbuffer( circle.normal );
  const ibo = glCat.createIndexbuffer( circle.index );

  // == path definition begin ==================================================
  glCatPath.add( {
    circle: {
      vert: require( '../shaders/object-with-uv.vert' ),
      frag: require( '../shaders/circle.frag' ),
      blend: [ gl.ONE, gl.ZERO ],
      cull: false,
      drawbuffers: 3,
      func: ( path, params ) => {
        glCat.attribute( 'aPos', vboPos, 3 );
        glCat.attributeDivisor( 'aUv', vboUv, 2 );
        glCat.attribute( 'aNor', vboNor, 3 );

        glCat.uniform1i( 'isShadow', params.isShadow );
        glCat.uniform3fv( 'color', [ 1.0, 0.1, 0.3 ] );

        gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, ibo );
        const xorshift = new Xorshift( 48884628198456 );
        for ( let i = 0; i < 8; i ++ ) {
          if (
            ( ( 1 + i ) / 8 ) <= auto( 'circle-visible' ) ||
            (
              ( i / 8 ) < auto( 'circle-visible' ) &&
              ( params.totalFrame % 4 < 2 )
            )
          ) {
            const scale = 1.6 + 0.3 * i;
            glCat.uniform1f( 'scale', scale );

            const speed = Math.PI * ( Math.floor( xorshift.gen() * 7.0 - 3.0 ) || 1.0 );
            const offset = 2.0 * Math.PI * xorshift.gen();
            const matM = MathCat.mat4Apply(
              MathCat.mat4RotateY( xorshift.gen() - 0.5 ),
              MathCat.mat4RotateX( xorshift.gen() - 0.5 ),
              MathCat.mat4RotateZ( offset + speed * context.automaton.progress ),
              MathCat.mat4ScaleXYZ( scale ),
              MathCat.mat4Identity()
            );
            glCat.uniformMatrix4fv( 'matM', matM );

            gl.drawElements( gl.TRIANGLES, circle.index.length, gl.UNSIGNED_SHORT, 0 );
          }
        }

        gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, null );
      }
    }
  } );

  // == hot reload stuff =======================================================
  if ( module.hot ) {
    module.hot.accept(
      [
        '../shaders/object-with-uv.vert',
        '../shaders/circle.frag'
      ],
      () => {
        glCatPath.replaceProgram(
          'circle',
          require( '../shaders/object-with-uv.vert' ),
          require( '../shaders/circle.frag' )
        );
      }
    );
  }
};