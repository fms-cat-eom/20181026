#extension GL_EXT_draw_buffers : require
precision highp float;

uniform vec3 bgColor;
uniform float perspFar;

// ------

void main() {
  gl_FragData[ 0 ] = vec4( bgColor, 1.0 );
  gl_FragData[ 1 ] = vec4( perspFar, 0.0, 0.0, 1.0 );
}