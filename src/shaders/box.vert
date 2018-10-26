// == defines ==================================================================
#define PI 3.14159265

// == attributes ===============================================================
attribute vec3 aPos;
attribute vec3 aNor;
attribute vec2 aMatrix;

// == varyings =================================================================
varying vec3 vPos;
varying vec3 vNor;

// == uniforms =================================================================
uniform float progress;
uniform vec2 resolution;

uniform bool isShadow;

uniform mat4 matP;
uniform mat4 matV;
uniform mat4 matPL;
uniform mat4 matVL;
uniform mat4 matM;

// == import functions =========================================================
#pragma glslify: rotate2D = require( ./utils/rotate2d );

// == main =====================================================================
void main() {
  vec4 pos = vec4( 0.5 * aPos, 1.0 );
  pos.yz = rotate2D( 1.0 * aMatrix.x + PI * 4.0 * progress ) * pos.yz;
  pos.zx = rotate2D( 1.0 * aMatrix.y + PI * 2.0 * progress ) * pos.zx;
  pos.xy += 0.2 * aMatrix;
  pos = matM * pos;
  vPos = pos.xyz;

  vec4 nor = vec4( aNor, 0.0 );
  nor.yz = rotate2D( 1.0 * aMatrix.x + PI * 4.0 * progress ) * nor.yz;
  nor.zx = rotate2D( 1.0 * aMatrix.y + PI * 2.0 * progress ) * nor.zx;
  nor = normalize( matM * nor );
  vNor = nor.xyz;

  vec4 outPos;
  if ( isShadow ) {
    outPos = matPL * matVL * pos;
  } else {
    outPos = matP * matV * pos;
    outPos.x /= resolution.x / resolution.y;
  }
  gl_Position = outPos;
}