mat2 rotate2D( float t ) {
  return mat2( cos( t ), -sin( t ), sin( t ), cos( t ) );
}

#pragma glslify: export(rotate2D)
