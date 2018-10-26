#define PI 3.14159265
#define TAU 6.28318531
#define saturate(i) clamp(i,0.,1.)

// ------

#extension GL_EXT_draw_buffers : require
precision highp float;

varying vec3 vPos;
varying vec3 vCol;
varying float vLife;

uniform mat4 matPL;
uniform mat4 matVL;

uniform vec3 cameraPos;
uniform float perspFar;
uniform vec3 lightPos;

uniform bool isShadow;

uniform sampler2D samplerShadow;

// == main procedure ===========================================================
void main() {
  if ( vLife <= 0.0 ) { discard; }

  if ( 0.5 < length( gl_PointCoord - 0.5 ) ) { discard; }

  if ( isShadow ) {
    float depth = length( vPos - lightPos );
    gl_FragData[ 0 ] = vec4( depth, 0.0, 0.0, 1.0 );
    return;
  }

  gl_FragData[ 0 ] = vec4( vPos, 1.0 );
  gl_FragData[ 1 ] = vec4( 0.0, 0.0, 1.0, 1.0 );
  gl_FragData[ 2 ] = vec4( 0.8, 0.9, 1.0, 2.0 );
}