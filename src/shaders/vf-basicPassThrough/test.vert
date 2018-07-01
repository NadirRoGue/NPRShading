#version 330

layout(location = 0) in vec4 VertexPosition;
layout(location = 1) in vec3 VertexNormal;
layout(location = 2) in vec2 VertexUV;

out vec3 vnormal;
out vec3 vpos;
out vec2 vuv;

uniform mat4 synth_ViewMatrix;
uniform mat4 synth_ProjectionMatrix;
uniform mat3 synth_NormalMatrix;

uniform mat4 ModelMatrix;

// Controls the UV scale (for crosshatching resolution)
uniform int UVScale;

void main()
{
	gl_Position =  synth_ProjectionMatrix * synth_ViewMatrix * ModelMatrix * VertexPosition;
	vpos = (synth_ViewMatrix * ModelMatrix * VertexPosition).xyz;
	vnormal = synth_NormalMatrix * VertexNormal;
	vuv = VertexUV * UVScale;
}
