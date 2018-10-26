// == shit =====================================================================
#extension GL_EXT_draw_buffers : require
precision highp float;

// == varyings =================================================================
varying vec3 vPos;
varying vec2 vUv;
varying vec3 vNor;

// == uniforms =================================================================
uniform vec3 lightPos;
uniform float scale;
uniform bool isShadow;

// == main =====================================================================
void main() {
  if ( isShadow ) {
    gl_FragData[ 0 ] = vec4( length( lightPos - vPos ), 0.0, 0.0, 1.0 );
    return;
  }

  // this bool means visibility
  bool b = false;

  vec2 uv = abs( vUv - 0.5 );

  // circle
  if ( abs( length( uv ) - 0.45 ) < 0.01 / scale ) { b = true; }

  // triangle
  if ( uv.x < 0.15 / scale ) {
    if ( uv.y - 0.45 < 0.03 / scale ) { b = true; }
    if ( ( uv.y - 0.45 ) - ( uv.x - 0.025 / scale ) * sqrt( 3.0 ) < 0.0 ) { b = false; }
  }

  if ( !b ) { discard; }

  gl_FragData[ 0 ] = vec4( vPos, 1.0 );
  gl_FragData[ 1 ] = vec4( vNor, 1.0 );
  gl_FragData[ 2 ] = vec4( 1.0, 1.1, 1.2, 2.0 );
}