function main() {
  const canvas = document.getElementById('mapCanvas');
  const gl = canvas.getContext("webgl");
  if (!gl) {
    console.error("No WEBGL Context");
    return;
  }

  const program = webglUtils.createProgramFromScripts(gl, ["vertex-shader-2d", "fragment-shader-2d"]);
  gl.useProgram(program);
  gl.enable(gl.DEPTH_TEST);

  const positionAttributeLocation = gl.getAttribLocation(program, "vertex");
  const texCoordAttributeLocation = gl.getAttribLocation(program, "texCoord");
  const normalAttributeLocation = gl.getAttribLocation(program, "normal");

  const colorLocation = gl.getUniformLocation(program, "color");
  const projectionMatrixLocation = gl.getUniformLocation(program, "projection");
  const modelviewMatrixLocation = gl.getUniformLocation(program, "modelView");

  const sphere = new Sphere(gl, 1.0, 36, 18, true);
  const texcoordBuffer = gl.createBuffer();
  const textCoordBufferData = new Float32Array([
    0.0,  0.0,
    1.0,  0.0,
    0.0,  1.0,
    0.0,  1.0,
    1.0,  0.0,
    1.0,  1.0,
  ]);
  const texture = gl.createTexture();

  let mouseStartX;
  let mouseStartY;
  let movingStarted = false;
  let rotationX = -120;
  let rotationY = -130;
  let zoomLevel = -5;
  let resetCursorTimeout;


  loadImage(function (image) {
    initTexture(image);
    initListeners();
    requestAnimationFrame(drawScene);
  });

  function initTexture(image) {
    gl.bindTexture(gl.TEXTURE_2D, texture);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
  }

  function initListeners() {
    canvas.addEventListener('mousedown', function (event) {
      event.preventDefault();
      mouseStartX = event.clientX;
      mouseStartY = event.clientY;
      movingStarted = true;
      canvas.style.cursor = 'grabbing';
    });
    canvas.addEventListener('mousemove', function (event) {
      event.preventDefault();
      if (movingStarted) {
        const mouseMoveX = event.clientX;
        const mouseMoveY = event.clientY;
        const xDiff = -((mouseMoveY - mouseStartY) / canvas.clientHeight) * (zoomLevel * 2);
        const yDiff = ((mouseMoveX - mouseStartX) / canvas.clientWidth) * (zoomLevel * 2);
        rotationX-=xDiff;
        rotationY-=yDiff;
      }
    });
    canvas.addEventListener('mouseup', function (event) {
      event.preventDefault();
      movingStarted = false;
      canvas.style.cursor = 'grab';
    });

    canvas.addEventListener('wheel', function (event) {
      event.preventDefault();
      if (resetCursorTimeout) {
        window.clearTimeout(resetCursorTimeout);
        resetCursorTimeout = undefined;
      }
      zoomLevel += event.deltaY * -0.001;
      canvas.style.cursor = event.deltaY > 0 ? 'zoom-out' : 'zoom-in';
      zoomLevel = Math.min(Math.max(-5, zoomLevel), -1.5);
      resetCursorTimeout = setTimeout(function() {
        canvas.style.cursor = 'grab';
      }, 300);
    });

  }


  function drawScene() {
    resizeCanvasToDisplaySize(gl.canvas);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
	gl.clearColor(0,0,0,1);


    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.useProgram(program);

    gl.enableVertexAttribArray(positionAttributeLocation);
    gl.enableVertexAttribArray(normalAttributeLocation);
    gl.enableVertexAttribArray(texCoordAttributeLocation);

	gl.bindBuffer(gl.ARRAY_BUFFER, sphere.vboVertex);
	gl.vertexAttribPointer(positionAttributeLocation, 3, gl.FLOAT, false, 32, 0);
	gl.vertexAttribPointer(normalAttributeLocation, 3, gl.FLOAT, false, 32, 12);
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, sphere.vboIndex);

    gl.vertexAttribPointer(texCoordAttributeLocation, 2, gl.FLOAT, false, 32, 24);
    gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, textCoordBufferData, gl.STATIC_DRAW);

    const projectionMatrix = m4.perspective(Math.PI/180*45, gl.canvas.width/gl.canvas.height, 0.1, 1000);

    let modelView = m4.lookAt([0,0,zoomLevel], [0,0,0],[0,1,0]);
	modelView = m4.xRotate(modelView, rotationX/180*Math.PI);
	modelView = m4.zRotate(modelView, rotationY/180*Math.PI);

    gl.uniformMatrix4fv(projectionMatrixLocation, false, projectionMatrix);
    gl.uniformMatrix4fv(modelviewMatrixLocation, false, modelView);
    gl.uniform4fv(colorLocation, [1, 0, 0, 1]);

	gl.drawElements(gl.TRIANGLES, sphere.getIndexCount(), gl.UNSIGNED_SHORT, 0);

    requestAnimationFrame(drawScene);
  }

  function resizeCanvasToDisplaySize(canvas) {
    const displayWidth  = canvas.clientWidth;
    const displayHeight = canvas.clientHeight;
    const needResize = canvas.width  !== displayWidth ||  canvas.height !== displayHeight;

    if (needResize) {
      canvas.width  = displayWidth;
      canvas.height = displayHeight;
    }

    return needResize;
  }

  function loadImage(callback) {
    const image = new Image();
    image.src = "world.png";
    image.onload = function() {
      callback(image);
    };
  }
}

main();
