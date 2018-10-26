// == shit =====================================================================
precision highp float;

// == uniforms =================================================================
uniform vec2 resolution;
uniform vec3 cameraPos;
uniform sampler2D sampler0;

// == main =====================================================================
void main() {
  vec2 uv = gl_FragCoord.xy / resolution;
  vec3 pos = texture2D( sampler0, uv ).xyz;
  gl_FragColor = vec4( length( cameraPos - pos ), 0.0, 0.0, 1.0 );
}