import './styles/main.scss';

// == import various modules / stuff ===========================================
import GLCat from './libs/glcat.js';
import GLCatPath from './libs/glcat-path-gui';
import MathCat from './libs/mathcat.js';
import UltraCat from './libs/ultracat.js';
import Automaton from '@fms-cat/automaton';
import CanvasSaver from './libs/canvas-saver';

import CONFIG from './config.json';

// == we are stull struggling by this ==========================================
const $ = document.querySelector.bind( document );

// == hi canvas ================================================================
const canvas = $( '#canvas' );
let width = canvas.width = CONFIG.resolution[ 0 ];
let height = canvas.height = CONFIG.resolution[ 1 ];

const saver = new CanvasSaver( canvas );

const gl = canvas.getContext( 'webgl' );
gl.lineWidth( 1 ); // e

const glCat = new GLCat( gl );
glCat.getExtension( 'OES_texture_float', true );
glCat.getExtension( 'OES_texture_float_linear', true );
glCat.getExtension( 'EXT_frag_depth', true );
glCat.getExtension( 'ANGLE_instanced_arrays', true );

const glCatPath = new GLCatPath( glCat, {
  el: $( '#divPath' ),
  canvas: canvas,
  stretch: true,
  drawbuffers: true
} );

// oh hi
const vboQuad = glCat.createVertexbuffer( new Float32Array( UltraCat.triangleStripQuad ) );

// == hello automaton ==========================================================
let totalFrame = 0;
let isInitialFrame = true;

const automaton = new Automaton( {
  loop: true,
  fps: 120,
  gui: $( '#divAutomaton' ),
  data: require( './automaton.json' )
} );
const auto = automaton.auto;

if ( module.hot ) {
  module.hot.accept(
    './automaton.json',
    () => automaton.load( require( './automaton.json' ) )
  );
}

// == lights, camera, action! ==================================================
let cameraPos = [ 0.0, 0.0, 0.0 ];
let cameraTar = [ 0.0, 0.0, 0.0 ];
let cameraRoll = 0.0; // protip: considering roll of cam is cool idea

let perspFov = 70.0;
let perspNear = 0.01;
let perspFar = 100.0;

let lightPos = [ 2.0, 5.0, 5.1 ]; // this is pretty random
let lightCol = [ 1.0, 1.0, 1.0 ]; // todo-ish

const shadowReso = CONFIG.shadowReso; // texture size for shadow buffer

let matP = MathCat.mat4Perspective( perspFov, perspNear, perspFar );
let matV = MathCat.mat4LookAt( cameraPos, cameraTar, [ 0.0, 1.0, 0.0 ], cameraRoll );
let matPL = MathCat.mat4Perspective( perspFov, perspNear, perspFar );
let matVL = MathCat.mat4LookAt( lightPos, cameraTar, [ 0.0, 1.0, 0.0 ], 0.0 );

const updateMatrices = ( camOffset ) => {
  cameraPos = [ 0.0, 0.0, auto( 'camera-Radius' ) ];
  cameraPos = MathCat.rotateVecByQuat( cameraPos, MathCat.quatAngleAxis( auto( 'camera-rotX', { smooth: 10.0 } ), [ 1.0, 0.0, 0.0 ] ) );
  cameraPos = MathCat.rotateVecByQuat( cameraPos, MathCat.quatAngleAxis( auto( 'camera-rotY', { smooth: 10.0 } ), [ 0.0, 1.0, 0.0 ] ) );
  if ( camOffset ) { cameraPos = MathCat.vecAdd( cameraPos, camOffset ); }

  matP = MathCat.mat4Perspective( perspFov, perspNear, perspFar );
  matV = MathCat.mat4LookAt( cameraPos, cameraTar, [ 0.0, 1.0, 0.0 ], cameraRoll );

  matPL = MathCat.mat4Perspective( perspFov, perspNear, perspFar );
  matVL = MathCat.mat4LookAt( lightPos, cameraTar, [ 0.0, 1.0, 0.0 ], 0.0 );
};
updateMatrices();

// == mouse listener, why tho ==================================================
let mouseX = 0.0;
let mouseY = 0.0;

canvas.addEventListener( 'mousemove', ( event ) => {
  mouseX = event.offsetX;
  mouseY = event.offsetY;
} );

// == global uniform variables =================================================
glCatPath.setGlobalFunc( () => {
  glCat.uniform1i( 'isInitialFrame', isInitialFrame );

  glCat.uniform1f( 'time', automaton.time );
  glCat.uniform1f( 'progress', automaton.progress );
  glCat.uniform1f( 'deltaTime', automaton.deltaTime );
  glCat.uniform1f( 'totalFrame', totalFrame );

  glCat.uniform3fv( 'cameraPos', cameraPos );
  glCat.uniform3fv( 'cameraTar', cameraTar );
  glCat.uniform1f( 'cameraRoll', cameraRoll );

  glCat.uniform1f( 'perspFov', perspFov );
  glCat.uniform1f( 'perspNear', perspNear );
  glCat.uniform1f( 'perspFar', perspFar );

  glCat.uniform3fv( 'lightPos', lightPos );
  glCat.uniform3fv( 'lightCol', lightCol );

  glCat.uniformMatrix4fv( 'matP', matP );
  glCat.uniformMatrix4fv( 'matV', matV );
  glCat.uniformMatrix4fv( 'matPL', matPL );
  glCat.uniformMatrix4fv( 'matVL', matVL );

  glCat.uniform2fv( 'mouse', [ mouseX, mouseY ] );

  glCat.uniform3fv( 'bgColor', [ 0.0, 0.0, 0.0 ] );
} );

// == glcat-path setup =========================================================
glCatPath.add( {
  return: {
    width: width,
    height: height,
    vert: require( './shaders/quad.vert' ),
    frag: require( './shaders/return.frag' ),
    blend: [ gl.ONE, gl.ZERO ],
    clear: [ 0.0, 0.0, 0.0, 1.0 ],
    func: ( path, params ) => {
      glCat.attribute( 'p', vboQuad, 2 );
      glCat.uniformTexture( 'sampler0', params.input, 0 );
      gl.drawArrays( gl.TRIANGLE_STRIP, 0, 4 );
    }
  },

  inspector: {
    width: width,
    height: height,
    vert: require( './shaders/quad.vert' ),
    frag: require( './shaders/inspector.frag' ),
    blend: [ gl.ONE, gl.ZERO ],
    clear: [ 0.0, 0.0, 0.0, 1.0 ],
    func: ( path, params ) => {
      glCat.attribute( 'p', vboQuad, 2 );
      glCat.uniform3fv( 'circleColor', [ 1.0, 1.0, 1.0 ] );
      glCat.uniformTexture( 'sampler0', params.input, 0 );
      gl.drawArrays( gl.TRIANGLE_STRIP, 0, 4 );
    }
  },

  target: {
    width: width,
    height: height,
    vert: require( './shaders/quad.vert' ),
    frag: require( './shaders/bg.frag' ),
    blend: [ gl.ONE, gl.ZERO ],
    clear: [ 0.0, 0.0, 0.0, 1.0 ],
    framebuffer: true,
    float: true,
    drawbuffers: 3,
    depthWrite: false,
    func: () => {
      // glCat.attribute( 'p', vboQuad, 2 );
      // gl.drawArrays( gl.TRIANGLE_STRIP, 0, 4 );
    }
  },

  shadow: {
    width: shadowReso,
    height: shadowReso,
    vert: require( './shaders/quad.vert' ),
    frag: require( './shaders/bg.frag' ),
    blend: [ gl.ONE, gl.ZERO ],
    clear: [ perspFar, 0.0, 0.0, 1.0 ],
    framebuffer: true,
    float: true,
    func: () => {
      // glCat.attribute( 'p', vboQuad, 2 );
      // gl.drawArrays( gl.TRIANGLE_STRIP, 0, 4 );
    }
  },
} );

// == setup paths ==============================================================
const context = {
  glCatPath: glCatPath,
  automaton: automaton,
  width: width,
  height: height
};

require( './paths/bloom' ).default( context );
require( './paths/box' ).default( context );
require( './paths/circle' ).default( context );
require( './paths/distance' ).default( context );
require( './paths/dof' ).default( context );
require( './paths/particles' ).default( context );
require( './paths/postfx' ).default( context );
require( './paths/render' ).default( context );

// == loop here ================================================================
const update = () => {
  if ( !$( '#active' ).checked ) {
    setTimeout( update, 100 );
    return;
  }

  // == update some bunch of shit ==============================================
  automaton.update();
  updateMatrices();

  // == let's render this ======================================================
  glCatPath.begin();

  // == compute particles ======================================================
  glCatPath.render( 'particlesComputeReturn' );
  glCatPath.render( 'particlesCompute' );

  // == shadow =================================================================
  glCatPath.render( 'shadow' );

  glCatPath.render( 'box', {
    target: glCatPath.fb( 'shadow' ),
    isShadow: true,
    width: shadowReso,
    height: shadowReso
  } );

  glCatPath.render( 'circle', {
    target: glCatPath.fb( 'shadow' ),
    totalFrame: totalFrame,
    isShadow: true,
    width: shadowReso,
    height: shadowReso
  } );

  glCatPath.render( 'particlesRender', {
    target: glCatPath.fb( 'shadow' ),
    isShadow: true,
    width: shadowReso,
    height: shadowReso
  } );

  // == foreground =============================================================
  glCatPath.render( 'target' );

  glCatPath.render( 'box', {
    target: glCatPath.fb( 'target' ),
    width: width,
    height: height
  } );

  glCatPath.render( 'circle', {
    target: glCatPath.fb( 'target' ),
    totalFrame: totalFrame,
    width: width,
    height: height
  } );

  glCatPath.render( 'particlesRender', {
    target: glCatPath.fb( 'target' ),
    width: width,
    height: height
  } );

  // == render =================================================================
  glCatPath.render( 'render', {
    inputs: glCatPath.fb( 'target' ).textures,
    shadow: glCatPath.fb( 'shadow' ).texture,
    width: width,
    height: height
  } );

  // == post ===================================================================
  glCatPath.render( 'distance', {
    input: glCatPath.fb( 'target' ).textures[ 0 ],
    width: width,
    height: height
  } );
  glCatPath.render( 'dof', {
    dry: glCatPath.fb( 'render' ).texture,
    depth: glCatPath.fb( 'distance' ).texture,
    width: width,
    height: height
  } );

  glCatPath.render( 'preBloom', {
    input: glCatPath.fb( 'dof' ).texture,
    bias: [ -0.9, -0.9, -0.9 ],
    factor: [ 1.0, 1.0, 1.0 ]
  } );
  glCatPath.render( 'bloom' );
  glCatPath.render( 'postBloom', {
    dry: glCatPath.fb( 'dof' ).texture
  } );

  glCatPath.render( 'fxaa', {
    input: glCatPath.fb( 'postBloom' ).texture
  } );

  glCatPath.render( 'post', {
    input: glCatPath.fb( 'fxaa' ).texture
  } );

  glCatPath.render( 'return', {
    target: GLCatPath.nullFb,
    input: glCatPath.fb( 'post' ).texture
  } );

  // glCatPath.render( 'inspector', {
  //   target: GLCatPath.nullFb,
  //   input: glCatPath.fb( 'shadow' ).texture
  // } );

  // == end ====================================================================
  glCatPath.end();

  // == save ===================================================================
  if ( $( '#save' ).checked ) {
    saver.capture();
    if ( automaton.fps * automaton.length * 1.1 < saver.frameCount ) {
      $( '#save' ).checked = false;
      saver.save();
    }
  }

  // == finalize the loop ======================================================
  isInitialFrame = false;
  totalFrame ++;

  requestAnimationFrame( update );
};

update();

// == keyboard is good =========================================================
window.addEventListener( 'keydown', ( event ) => {
  if ( event.which === 27 ) { // panic button
    $( '#active' ).checked = false;
  }

  if ( event.which === 32 ) { // play / pause
    automaton.isPlaying ? automaton.pause() : automaton.play();
  }
} );