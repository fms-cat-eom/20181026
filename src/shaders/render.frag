// == shit =====================================================================
precision mediump float;

// == uniforms =================================================================
uniform vec2 resolution;
uniform mat4 matPL;
uniform mat4 matVL;
uniform vec3 cameraPos;
uniform vec3 lightPos;
uniform vec3 lightCol;
uniform vec3 bgColor;
uniform sampler2D sampler0;
uniform sampler2D sampler1;
uniform sampler2D sampler2;
uniform sampler2D samplerShadow;

// == struct: isect ============================================================
struct Isect {
  vec3 pos;
  vec3 nor;
  int mtl;
  vec4 props;
};

Isect getIsect( vec2 _uv ) {
  vec4 tex0 = texture2D( sampler0, _uv );
  vec4 tex1 = texture2D( sampler1, _uv );
  vec4 tex2 = texture2D( sampler2, _uv );

  Isect isect;
  isect.pos = tex0.xyz;
  isect.nor = tex1.xyz;
  isect.mtl = int( tex2.w );
  isect.props = vec4( tex2.xyz, fract( floor( tex2.w ) ) );

  return isect;
}

// == shadow ===================================================================
float shadow( Isect _isect ) {
  vec3 lig = _isect.pos - lightPos;
  float d = max( 0.001, dot( -_isect.nor, normalize( lig ) ) );

  vec4 pl = matPL * matVL * vec4( _isect.pos, 1.0 );
  vec2 uv = pl.xy / pl.w * 0.5 + 0.5;

  float dc = length( lig );
  float ret = 0.0;
  for ( int iy = -1; iy <= 1; iy ++ ) {
    for ( int ix = -1; ix <= 1; ix ++ ) {
      vec2 uv = uv + vec2( float( ix ), float ( iy ) ) * 1E-3;
      float proj = texture2D( samplerShadow, uv ).x;
      float bias = 0.1 + ( 1.0 - d ) * 0.3;

      float dif = smoothstep( bias * 2.0, bias, abs( dc - proj ) );
      ret += dif / 9.0;
    }
  }
  return ret;
}

// == do shading ===============================================================
vec3 radiance( Isect _isect, vec3 dif, vec3 spe, float rough ) {
  // Ref: https://www.shadertoy.com/view/lsXSz7

  // calc a bunch of vectors
  vec3 ligDir = normalize( _isect.pos - lightPos );
  vec3 viewDir = normalize( _isect.pos - cameraPos );
  vec3 halfDir = normalize( ligDir + viewDir );

  float dotLig = max( 0.001, dot( -_isect.nor, ligDir ) );
  float dotView = max( 0.001, dot( -_isect.nor, viewDir ) );
  float dotHalf = max( 0.001, dot( -_isect.nor, halfDir ) );
  float dotHalfView = max( 0.001, dot( halfDir, viewDir ) );

  // Cook-Torrance
  float G = min( 1.0, 2.0 * dotHalf * min( dotView, dotLig ) / dotHalfView );

  // Beckmann
  float sqDotHalf = dotHalf * dotHalf;
  float sqDotHalfRough = sqDotHalf * rough * rough;
  float D = exp( ( sqDotHalf - 1.0 ) / sqDotHalfRough ) / ( sqDotHalf * sqDotHalfRough );

  // Fresnel
  vec3 Fspe = spe + ( 1.0 - spe ) * pow( 1.0 - dotHalfView, 5.0 );
  vec3 Fdif = spe + ( 1.0 - spe ) * pow( 1.0 - dotLig, 5.0 );

  // BRDF
  vec3 brdfSpe = Fspe * D * G / ( dotView * dotLig * 4.0 );
  vec3 brdfDif = dif * ( 1.0 - Fdif );

  // shadow
  float sh = mix( 0.2, 1.0, shadow( _isect ) );

  return ( brdfSpe + brdfDif ) * lightCol * dotLig * sh;
}

// == main =====================================================================
void main() {
  vec2 uv = gl_FragCoord.xy / resolution;
  Isect isect = getIsect( uv );

  // if there are no normal, it's an air
  if ( length( isect.nor ) < 0.5 ) {
    gl_FragColor = vec4( 0.0, 0.0, 0.0, 1.0 );
    return;
  }

  // material
  vec3 col;
  if ( isect.mtl == 1 ) {
    col = radiance( isect, isect.props.xyz, vec3( 0.1 ), 0.2 );
  } else if ( isect.mtl == 2 ) {
    col = isect.props.xyz;
  }

  gl_FragColor = vec4( col, 1.0 );
}