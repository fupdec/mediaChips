let fpsCount = 0;


function Texture(gl) {
    this.gl = gl;
    this.texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.texture);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
}

Texture.prototype.bind = function (n, program, name) {
    const gl = this.gl;
    gl.activeTexture([gl.TEXTURE0, gl.TEXTURE1, gl.TEXTURE2][n]);
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.uniform1i(gl.getUniformLocation(program, name), n);
}
Texture.prototype.fill = function (width, height, data) {
    const gl = this.gl;
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, width, height, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, data);
}

Texture.prototype.destroy = function () {
    this.gl.deleteTexture(this.texture);
}

function render(canvas, videoFrame, vlcInput, checkFps) {
    if (checkFps) fpsCount++;
    const gl = canvas.gl;
    gl.y.fill(vlcInput.width, vlcInput.height,
        videoFrame.subarray(0, vlcInput.uOffset));
    gl.u.fill(vlcInput.width >> 1, vlcInput.height >> 1,
        videoFrame.subarray(vlcInput.uOffset, vlcInput.vOffset));
    gl.v.fill(vlcInput.width >> 1, vlcInput.height >> 1,
        videoFrame.subarray(vlcInput.vOffset, videoFrame.length));
}

const renderFallback = (canvas, videoFrame, vlcInput) => {
    const buf = canvas.img.data;
    const width = vlcInput.width;
    const height = vlcInput.height;
    for (let i = 0; i < height; ++i) {
        for (let j = 0; j < width; ++j) {
            const o = (j + (width * i)) * 4;
            buf[o + 0] = videoFrame[o + 2];
            buf[o + 1] = videoFrame[o + 1];
            buf[o + 2] = videoFrame[o + 0];
            buf[o + 3] = videoFrame[o + 3];
        }
    }
    canvas.ctx.putImageData(canvas.img, 0, 0);
};

function setupCanvas(canvas, vlcPlayer, options) {
    if (!options.fallbackRenderer)
        canvas.gl = canvas.getContext("webgl", {
            preserveDrawingBuffer: Boolean(options.preserveDrawingBuffer)
        });
    const gl = canvas.gl;
    if (!gl || options.fallbackRenderer) {
        console.log(options.fallbackRenderer ? "Fallback renderer forced, not using WebGL" : "Unable to initialize WebGL, falling back to canvas rendering");
        vlcPlayer.pixelFormat = 'RV32';
        canvas.ctx = canvas.getContext("2d");
        delete canvas.gl; // in case of fallback renderer
        return;
    }

    vlcPlayer.pixelFormat = 'I420';
    canvas.I420Program = gl.createProgram();
    const program = canvas.I420Program;
    const vertexShaderSource = [
        "attribute highp vec4 aVertexPosition;",
        "attribute vec2 aTextureCoord;",
        "varying highp vec2 vTextureCoord;",
        "void main(void) {",
        " gl_Position = aVertexPosition;",
        " vTextureCoord = aTextureCoord;",
        "}"
    ].join("\n");
    const vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader, vertexShaderSource);
    gl.compileShader(vertexShader);
    const fragmentShaderSource = [
        "precision highp float;",
        "varying lowp vec2 vTextureCoord;",
        "uniform sampler2D YTexture;",
        "uniform sampler2D UTexture;",
        "uniform sampler2D VTexture;",
        "const mat4 YUV2RGB = mat4",
        "(",
        " 1.1643828125, 0, 1.59602734375, -.87078515625,",
        " 1.1643828125, -.39176171875, -.81296875, .52959375,",
        " 1.1643828125, 2.017234375, 0, -1.081390625,",
        " 0, 0, 0, 1",
        ");",
        "void main(void) {",
        " gl_FragColor = vec4( texture2D(YTexture, vTextureCoord).x, texture2D(UTexture, vTextureCoord).x, texture2D(VTexture, vTextureCoord).x, 1) * YUV2RGB;",
        "}"
    ].join("\n");

    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShader, fragmentShaderSource);
    gl.compileShader(fragmentShader);
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    gl.useProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.log("Shader link failed.");
    }
    const vertexPositionAttribute = gl.getAttribLocation(program, "aVertexPosition");
    gl.enableVertexAttribArray(vertexPositionAttribute);
    const textureCoordAttribute = gl.getAttribLocation(program, "aTextureCoord");
    gl.enableVertexAttribArray(textureCoordAttribute);

    const verticesBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, verticesBuffer);
    gl.bufferData(gl.ARRAY_BUFFER,
        new Float32Array([1.0, 1.0, 0.0, -1.0, 1.0, 0.0, 1.0, -1.0, 0.0, -1.0, -1.0, 0.0]),
        gl.STATIC_DRAW);
    gl.vertexAttribPointer(vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);
    const texCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER,
        new Float32Array([1.0, 0.0, 0.0, 0.0, 1.0, 1.0, 0.0, 1.0]),
        gl.STATIC_DRAW);
    gl.vertexAttribPointer(textureCoordAttribute, 2, gl.FLOAT, false, 0, 0);

    gl.y = new Texture(gl);
    gl.u = new Texture(gl);
    gl.v = new Texture(gl);
    gl.y.bind(0, program, "YTexture");
    gl.u.bind(1, program, "UTexture");
    gl.v.bind(2, program, "VTexture");
}

function frameSetup(canvas, width, height) {
    const gl = canvas.gl;
    canvas.width = width;
    canvas.height = height;
    if (!gl) {
        canvas.img = canvas.ctx.createImageData(width, height);
        return;
    }
    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
}

module.exports = {
    bind(canvas, vlcPlayer, options) {
        if (!options) options = {};
        let newFrame;

        if (typeof canvas === 'string')
            canvas = window.document.querySelector(canvas);

        this.gl = canvas.gl;
        setupCanvas(canvas, vlcPlayer, options);

        vlcPlayer.on('frameSetup', (width, height, uOffset, vOffset, pixelFormat) => {
            frameSetup(canvas, width, height, pixelFormat);
            if (typeof options.onFrameSetup === "function")
                options.onFrameSetup(width, height, pixelFormat);

            const draw = () => {
                this.drawLoop = window.requestAnimationFrame(() => {
                    const gl = canvas.gl;
                    if (gl && newFrame) gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
                    newFrame = false;
                    draw();
                });
            };
            draw();

            canvas.addEventListener("webglcontextlost",
                event => {
                    event.preventDefault();
                    console.log("webgl context lost");
                }, false);

            canvas.addEventListener("webglcontextrestored",
                ((w, h, p) => () => {
                    setupCanvas(canvas, vlcPlayer, options);
                    frameSetup(canvas, w, h, p);
                    console.log("webgl context restored");
                })(width, height, pixelFormat), false);
        });

        vlcPlayer.on('frameReady', videoFrame => {
            (canvas.gl ? render : renderFallback)(canvas, videoFrame, vlcPlayer.input, this.checkFps);
            newFrame = true;
            if (typeof options.onFrameReady === "function")
                options.onFrameReady(videoFrame);
        });
        vlcPlayer.on('frameCleanup', () => {
            if (this.drawLoop) {
                window.cancelAnimationFrame(this.drawLoop);
                this.drawLoop = null;
            }
            if (typeof options.onFrameCleanup === "function")
                options.onFrameCleanup();
        });
    },
    checkFps: false,
    getFps(cb, timeout = 1000) {
        this.checkFps = true;
        setTimeout(() => {
            this.checkFps = false;
            cb(fpsCount);
            fpsCount = 0;
        }, timeout);
    },
    clear(canvas) {
        const gl = canvas.gl,
            arr1 = new Uint8Array(1),
            arr2 = new Uint8Array(1);

        arr1[0] = 0;
        arr2[0] = 128;

        gl.y.fill(1, 1, arr1);
        gl.u.fill(1, 1, arr2);
        gl.v.fill(1, 1, arr2);

        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    },
    destroy() {
        if (this.gl) {
            if (this.gl.y)
                this.gl.y.destroy();
            if (this.gl.u)
                this.gl.u.destroy();
            if (this.gl.v)
                this.gl.v.destroy();
        }
        window.cancelAnimationFrame(this.drawLoop);
    },
};
