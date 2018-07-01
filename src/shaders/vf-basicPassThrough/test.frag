#version 330

in vec3 vnormal;
in vec3 vpos;
in vec2 vuv;

out vec4 glFragColor;

// Toon shading properties
uniform float ContourFactor;
uniform int DiffuseIntervals;
uniform float SpecularRange;

// Model material properties
uniform vec3 ModelColor;
uniform float SpecularCoefficent;

// Light parameters
uniform vec3 LightPos;
uniform vec3 LightDiffuseIntensity;
uniform vec3 LightAmbientIntensity;
uniform vec3 LightSpecularIntensity;

// Control whether we draw in Toon shading (if true) or CrossHatching (if false)
uniform bool ToonShading;

// Cross hatching precomputed tone art maps (extracted from  [Praun et al. 2001])
uniform sampler2D Hatch1;
uniform sampler2D Hatch2;
uniform sampler2D Hatch3;
uniform sampler2D Hatch4;
uniform sampler2D Hatch5;
uniform sampler2D Hatch6;

vec3 toonShade()
{
	vec3 color = vec3(0.0);

	// ambient
	color += LightAmbientIntensity * ModelColor;

	// diffuse
	vec3 L = LightPos - vpos;

	float diffuseFactor = max(0, dot(normalize(L), vnormal));
	float ceiled = ceil(diffuseFactor * DiffuseIntervals);
	float toonFactor = ceiled / DiffuseIntervals;
	color += clamp(LightDiffuseIntensity * ModelColor * toonFactor, 0.0, 1.0);

	// // Blinn - Phong specular shading
	vec3 V = -vpos;
	vec3 H = L + V;
	H = normalize(H);

	float specFactor = pow (max(0, dot(vnormal, H)), SpecularCoefficent);
	float specularToonFactor = specFactor > SpecularRange? 1.0 : 0.0;
	color += LightSpecularIntensity * ceil(specFactor) * specularToonFactor;

	return color;
}

vec3 shadeCrossHatching()
{
	// We dont need to calculate light color for crosshatching
	// so we only employ R component of light

	// ambient
	float color  = 0.0;
	color += LightAmbientIntensity.x;

	// diffuse
	vec3 L = LightPos - vpos;
	float diffuseFactor = max(0, dot(normalize(L), vnormal));
	color += LightDiffuseIntensity.x * diffuseFactor;

	// Blinn - Phong specular shading
	vec3 V = -vpos;
	vec3 H = L + V;
	H = normalize(H);
	float specFactor = pow (max(0, dot(vnormal, H)), SpecularCoefficent);
	color += LightSpecularIntensity.x * specFactor;

	color = clamp(color, 0.0, 1.0);

	// 1 pass 6 way blend
	float intervalLen = 1.0/3.0;
	float lvl1_alpha = (color - intervalLen) / intervalLen;
	float lvl2_alpha = (color - (intervalLen * 2.0)) / intervalLen;
	float lvl3_alpha = (color - (intervalLen * 3.0)) / intervalLen;
	float lvl4_alpha = (color - (intervalLen * 4.0)) / intervalLen;
	float lvl5_alpha = (color - (intervalLen * 5.0)) / intervalLen;

	float lvl1_testFactor = abs(1.0 - abs(lvl1_alpha)) >= 0.0? 1.0 : 0.0;
	float lvl2_testFactor = abs(1.0 - abs(lvl2_alpha)) >= 0.0? 1.0 : 0.0;
	float lvl3_testFactor = abs(1.0 - abs(lvl3_alpha)) >= 0.0? 1.0 : 0.0;
	float lvl4_testFactor = abs(1.0 - abs(lvl4_alpha)) >= 0.0? 1.0 : 0.0;
	float lvl5_testFactor = abs(1.0 - abs(lvl5_alpha)) >= 0.0? 1.0 : 0.0;

	vec3 hatch0 = (texture(Hatch6, vuv).rgb * (1.0 - lvl5_alpha) + texture(Hatch5, vuv).rgb * lvl5_alpha) * lvl5_testFactor;
	vec3 hatch1 = (texture(Hatch5, vuv).rgb * (1.0 - lvl4_alpha) + texture(Hatch4, vuv).rgb * lvl4_alpha) * lvl4_testFactor;
	vec3 hatch2 = (texture(Hatch4, vuv).rgb * (1.0 - lvl3_alpha) + texture(Hatch3, vuv).rgb * lvl3_alpha) * lvl3_testFactor;
	vec3 hatch3 = (texture(Hatch3, vuv).rgb * (1.0 - lvl2_alpha) + texture(Hatch2, vuv).rgb * lvl2_alpha) * lvl2_testFactor;
	vec3 hatch4 = (texture(Hatch2, vuv).rgb * (1.0 - lvl1_alpha) + texture(Hatch1, vuv).rgb * lvl1_alpha) * lvl1_testFactor;

	vec3 finalHatch = (hatch0 + hatch1 + hatch2 + hatch3 + hatch4);
	vec3 colorDiff = vec3(1,1,1) - finalHatch;

	return finalHatch + colorDiff * ModelColor;
}

void main()
{
	// Border
	// For cross hatching, we use the model color to draw the border
	// For toon shading, we draw it black
	vec3 vpos2 = normalize(vpos);
	float value = dot(vnormal, -vpos2);
	vec3 color = ToonShading? toonShade() : shadeCrossHatching();
	bool isBorder = value <= ContourFactor;

	vec3 finalColor = ToonShading? (isBorder? vec3(0,0,0) : color) : (isBorder? ModelColor : color);

	glFragColor = vec4(finalColor, 1.0);

}
