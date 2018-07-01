"use strict";
//out.println();

Synthclipse.debugMode = true;

Synthclipse.setGLVersion(3, 3);
Synthclipse.load("gl-matrix-min.js");

var vShader = "shaders/vf-basicPassThrough/test.vert";
var fShader = "shaders/vf-basicPassThrough/test.frag";

var hatch1;
var hatch2;
var hatch3;
var hatch4;
var hatch5;
var hatch6;

//! <group name="Main"/>
var currentShapeID 	=  0; //! combobox[0, "Cone", "Sphere", "Torus", "Box", "Teapot", "Axes", "Cylinder", "Trefoil Knot", "Torus Knot", "Line", "Quad", "Plane" ]
var lastShapeID 	= -1;
var shadingModel = 0; //! combobox[0, "Toon", "CrossHatching" ]
var toonShading = true;

//! <group name="Light Settings"/>
var LightPos = Native.newVector3(); //! slider[(-10.0,-10.0,-10.0), (0.0,0.0,0.0) (10.0,10.0,10.0)]
var LightDiffuseIntensity = Native.newColorRGB(); //! color[1.0, 1.0, 1.0]
var LightAmbientIntensity = Native.newColorRGB(); //! color[0.1, 0.1, 0.1]
var LightSpecularIntensity = Native.newColorRGB(); //! color[1.0, 1.0, 1.0]

//! <group name="Model Settings"/>
var ModelColor = [1.0, 1.0, 1.0]; //! color[0.0, 0.0, 0.0]
var SpecularCoefficent = 10; //! islider[0, 10, 100]

//! <group name="Toon Settings"/>
var ContourFactor = .15; //! slider[0.0, 0.15, 1.0]
var DiffuseIntervals = 3; //! islider[1, 3, 20]
var SpecularRange = 0.65; //! slider[0.1, 0.65, 1.0] 

//! <group name="Hatching Settings"/>
var UVScale = 6; //! islider[1, 6, 10]


//! <group name="Cone"/>
var coneRadius 			= 0.5; //! slider[0.1, 3, 10]
var coneHeight 			= 1; //! slider[0.1, 5, 10]
var coneTessellation 	= 16; //! islider[8, 32, 64]

//! <group name="Sphere"/>
var sphereRadius 		= 3; //! slider[1, 3, 10]
var sphereTessellation 	= 16; //! islider[4, 24, 64]

//! <group name="Torus"/>
var torusInnerRadius 	= 0.5; //! slider[0.1, 1, 10]
var torusOuterRadius 	= 1; //! slider[0.1, 2, 10]
var torusRings 			= 16; //! islider[4, 24, 64]
var torusSides 			= 16; //! islider[4, 24, 64]

//! <group name="Box"/>
var boxLengthX = 1; //! slider[0.1, 5, 10]
var boxLengthY = 1; //! slider[0.1, 5, 10]
var boxLengthZ = 1; //! slider[0.1, 5, 10]

//! <group name="Teapot"/>
var teapotTessellation = 4; //! islider[1, 4, 16]

//! <group name="Cylinder"/>
var cylinderRadius 			= 0.5; //! slider[0.1, 2, 10]
var cylinderHeight 			= 1; //! slider[0.1, 5, 10]
var cylinderTessellation 	= 16; //! islider[8, 32, 64]

//! <group name="TrefoilKnot"/>
var trefoilSlices = 128; //! islider[16, 128, 256]
var trefoilStacks = 32; //! islider[16, 32, 128]

//! <group name="TrousKnot"/>
var torusKnotP 				= 3; //! islider[1, 3, 16]
var torusKnotQ 				= 4; //! islider[1, 4, 16]
var torusKnotNumSegments 	= 64; //! islider[16, 64, 256]
var torusKnotNumRings 		= 64; //! islider[16, 64, 256]
var torusKnotRadius 		= 1;  //! slider[0.1, 1, 10]
var torusKnotDistance 		= 5; //! slider[1, 5, 25]

//! <group name="Plane"/>
var planeSizeX 			= 100; //! slider[1, 150, 200]
var planeSizeZ 			= 100; //! slider[1, 150, 200]
var planeTessellationX 	= 20; //! slider[1, 20, 50]
var planeTessellationZ 	= 20; //! slider[1, 20, 50]

//! <group name="Quad"/>
var quadHalfLength = 1; //! slider[1, 4, 15];

//! <group name="Line"/>
var lineP1 = Native.newVector3(-10, -10, -10); //! slider[(-10,-10,-10), (-10,-10,-10), (10,10,10)]
var lineP2 = Native.newVector3(10, 10, 10); //! slider[(-10,-10,-10), (10,10,10), (10,10,10)]

//! <group name="Axes"/>
var axesLength = 100; //! slider[1, 100, 100]

var program = null;

var backgroundColor = Native.newColorRGB(); //! color[0, 0, 0]

var renderable = {};
var modelToRender = null;

function drawScene() 
{
	gl.clearColor(backgroundColor.r, backgroundColor.g, backgroundColor.b, 1.0);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	
	if (lastShapeID != currentShapeID) 
	{
		switchModels(currentShapeID);
		lastShapeID = currentShapeID;
	}	
	
	switchShading(shadingModel);
	
	program.use();
	
	applyParameters() ;	
	program.applyUniforms();
	
	modelToRender.render(program);
}

function Model(nativeModel, x, y, z) 
{
	this.obj = nativeModel;

	this.obj.transform.translate(x, y, z);

	this.render = function(program) 
	{
		program.setUniform("ModelMatrix", nativeModel.transform);
		
		var cam = CameraManager.getSphericalCamera();
		var view = cam.getViewMatrix();
		var tempPos = Native.newVector4();
		tempPos.x = LightPos.x;
		tempPos.y = LightPos.y;
		tempPos.z = LightPos.z;
		tempPos.w = 1.0;
		var CameraLightPos = view.mult(tempPos);
		var finalPos = Native.newVector3();
		finalPos.x = CameraLightPos.x;
		finalPos.y = CameraLightPos.y;
		finalPos.z = CameraLightPos.z;
		
		program.setUniform("LightPos", finalPos);
		program.setUniform("LightDiffuseIntensity", LightDiffuseIntensity);
		program.setUniform("LightAmbientIntensity", LightAmbientIntensity);
		program.setUniform("LightSpecularIntensity", LightSpecularIntensity);
		program.setUniformFloat("ContourFactor", ContourFactor);
		program.setUniformInt("DiffuseIntervals", DiffuseIntervals);
		program.setUniformFloat("SpecularRange", SpecularRange);
		program.setUniform("ModelColor", ModelColor);
		program.setUniformFloat("SpecularCoefficent", SpecularCoefficent);
		
		program.setUniform("ToonShading", toonShading);
		
		program.setUniformInt("UVScale", UVScale);
		
		program.setUniformInt("Hatch1", 0);
		program.setUniformInt("Hatch2", 1);
		program.setUniformInt("Hatch3", 2);
		program.setUniformInt("Hatch4", 3);
		program.setUniformInt("Hatch5", 4);
		program.setUniformInt("Hatch6", 5);
		
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, hatch1.id);
		gl.activeTexture(gl.TEXTURE0 + 1);
		gl.bindTexture(gl.TEXTURE_2D, hatch2.id);
		gl.activeTexture(gl.TEXTURE0 + 2);
		gl.bindTexture(gl.TEXTURE_2D, hatch3.id);
		gl.activeTexture(gl.TEXTURE0 + 3);
		gl.bindTexture(gl.TEXTURE_2D, hatch4.id);
		gl.activeTexture(gl.TEXTURE0 + 4);
		gl.bindTexture(gl.TEXTURE_2D, hatch5.id);
		gl.activeTexture(gl.TEXTURE0 + 5);
		gl.bindTexture(gl.TEXTURE_2D, hatch6.id);
		
		nativeModel.render();
	};
}

function switchShading(id)
{
	switch(id)
	{
		case 0: //Toon
			toonShading = true;
			break;
		case 1:
			toonShading = false;
			break;
	}
}

function switchModels(id) 
{	
	switch (id) 
	{
		case 0://Cone
			
			var model = GeometryFactory.createCone(coneRadius, coneHeight, coneTessellation);
			modelToRender = new Model(model, 0, 0, 0);	
			break;
		case 1://Sphere			
			var model = GeometryFactory.createSphere(sphereRadius, sphereTessellation);
			modelToRender = new Model(model, 0, 0, 0);	
			break;
		case 2://Torus
			var model = GeometryFactory.createTorus(torusInnerRadius, torusOuterRadius, torusRings, torusSides);
			modelToRender = new Model(model, 0, 0, 0);	
			break;
		case 3://Box			
			var model = GeometryFactory.createBox(boxLengthX, boxLengthY, boxLengthZ);
			modelToRender = new Model(model, 0, 0, 0);	
			break;
		case 4://Teapot	
			var model = GeometryFactory.createTeapot(teapotTessellation);
			modelToRender = new Model(model, 0, 0, 0);	
			break;
		case 5://Axes		
			var model = GeometryFactory.createAxes(axesLength);
			modelToRender = new Model(model, 0, 0, 0);	
			break;
		case 6://Cylinder
			var model = GeometryFactory.createCylinder(cylinderRadius, cylinderHeight, cylinderTessellation);
			modelToRender = new Model(model, 0, 0, 0);	
			break;
		case 7://Trefoi
			var model = GeometryFactory.createTrefoilKnot(trefoilSlices, trefoilStacks);
			modelToRender = new Model(model, 0, 0, 0);	
			break;
		case 8://TorusKnot
			var model = GeometryFactory.createTorusKnot(torusKnotP, torusKnotQ, torusKnotNumSegments,
					torusKnotNumRings, torusKnotRadius, torusKnotDistance);
			//torusKnot.transform.scale(0.3);
			modelToRender = new Model(model, 0, 0, 0);	
			break;
		case 9://Line
			var model = GeometryFactory.createLine(lineP1, lineP2);
			modelToRender = new Model(model, 0, 0, 0);	
			break;
		case 10://Quad
			var model = GeometryFactory.createQuad(quadHalfLength);
			modelToRender = new Model(model, 0, 0, 0);	
			break;
		case 11://Plane	
			var model = GeometryFactory.createPlane(planeSizeX, planeSizeZ, planeTessellationX,
					planeTessellationZ);
			modelToRender = new Model(model, 0, 0, 0);	
			//modelToRender.material.useTexture = true;
			break;
		default:
			break;
	}
}

function applyParameters() 
{
	var model = modelToRender.obj;
	
	switch (currentShapeID) 
	{
		case 0://Cone
			model.radius = coneRadius;
			model.height = coneHeight;
			model.tessellation = coneTessellation;
		break;
		case 1://sphere 
			model.radius = sphereRadius;
			model.tessellation = sphereTessellation;
		break;
	
		case 2://torus	
			model.innerRadius = torusInnerRadius;
			model.outerRadius = torusOuterRadius;
			model.rings = torusRings;
			model.sides = torusSides;
		break;
		case 3://box
			model.lengthX = boxLengthX;
			model.lengthY = boxLengthY;
			model.lengthZ = boxLengthZ;
		break;	
		case 4://teapot	
			model.tessellation = teapotTessellation;
		break;

		case 6://Cylinder
			model.radius = cylinderRadius;
			model.height = cylinderHeight;
			model.tessellation = cylinderTessellation;
		break;
		case 7://Trefoil
			model.slices = trefoilSlices;
			model.stacks = trefoilStacks;
		break;
		case 8://Knot
			model.p = torusKnotP;
			model.q = torusKnotQ;
			model.numSegments = torusKnotNumSegments;
			model.numRings = torusKnotNumRings;
			model.radius = torusKnotRadius;
			model.distance = torusKnotDistance;
		break;
		default:
			break;
		}
}

function initShaders() 
{
	program = ProgramFactory.createProgram("GLSL testing");

	program.attachShader(vShader);	
	program.attachShader(fShader);		
	
	program.link();

    Synthclipse.createControls(program);
    Synthclipse.createScriptControls();
    
    program.loadPreset("Default");
    Synthclipse.loadPreset("Default");
}

function loadTexture(name)
{
	var texture = Synthclipse.loadTexture("../textures/"+name+".jpg");
	gl.bindTexture(gl.TEXTURE_2D, texture.id);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.generateMipmap(gl.TEXTURE_2D);

    gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);

    gl.bindTexture(gl.TEXTURE_2D, 0);
    
    return texture;
}

function loadHatches()
{
	hatch1 = loadTexture("hatch_0");
	hatch2 = loadTexture("hatch_1");
	hatch3 = loadTexture("hatch_2");
	hatch4 = loadTexture("hatch_3");
	hatch5 = loadTexture("hatch_4");
	hatch6 = loadTexture("hatch_5");
}

renderable.init = function() 
{
	initShaders();
	
	loadHatches();
	
	switchModels(0);
	
	var sphericalCamera = CameraManager.getSphericalCamera();
	sphericalCamera.setPosition(0.0, 0.0, -6.0);

	CameraManager.useSphericalCamera();
	CameraManager.setZoomFactor(0.4);
	
	gl.enable(gl.DEPTH_TEST);
};

renderable.display = function() 
{	
	drawScene();
};

Synthclipse.setRenderable(renderable);

/*!
 * <preset name="Default">
 *  backgroundColor = 0.5, 0.5, 0.5
 *  axesLength = 100.0
 *  boxLengthX = 5.0
 *  boxLengthY = 5.0
 *  boxLengthZ = 5.0
 *  coneHeight = 5.0
 *  coneRadius = 3.0
 *  coneTessellation = 32
 *  currentShapeID = 0
 *  cylinderHeight = 5.0
 *  cylinderRadius = 2.0
 *  cylinderTessellation = 32
 *  lineP1 = -10.0, -10.0, -10.0
 *  lineP2 = 10.0, 10.0, 10.0
 *  planeSizeX = 150.0
 *  planeSizeZ = 150.0
 *  planeTessellationX = 20.0
 *  planeTessellationZ = 20.0
 *  quadHalfLength = 4.0
 *  sphereRadius = 3.0
 *  sphereTessellation = 24
 *  teapotTessellation = 4
 *  torusInnerRadius = 1.0
 *  torusKnotDistance = 5.0
 *  torusKnotNumRings = 64
 *  torusKnotNumSegments = 64
 *  torusKnotP = 3
 *  torusKnotQ = 4
 *  torusKnotRadius = 1.0
 *  torusOuterRadius = 2.0
 *  torusRings = 24
 *  torusSides = 24
 *  trefoilSlices = 128
 *  trefoilStacks = 32
 *  wireframeMode = false
 * </preset>
 */

