// == shit =====================================================================
#extension GL_EXT_draw_buffers : require
precision highp float;

// == varyings =================================================================
varying vec3 vPos;
varying vec3 vNor;

// == uniforms =================================================================
uniform vec3 lightPos;

uniform bool isShadow;

uniform vec3 color;

// == main =====================================================================
void main() {
  if ( isShadow ) {
    gl_FragData[ 0 ] = vec4( length( lightPos - vPos ), 0.0, 0.0, 1.0 );
    return;
  }

  gl_FragData[ 0 ] = vec4( vPos, 1.0 );
  gl_FragData[ 1 ] = vec4( vNor, 1.0 );
  gl_FragData[ 2 ] = vec4( color, 1.0 );
}