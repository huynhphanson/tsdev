export function initCesium() {
  const cesiumContainer = document.getElementById('cesium-container');

  Cesium.Ion.defaultAccessToken = import.meta.env.VITE_CESIUM_TOKEN;

  const cesiumViewer = new Cesium.Viewer(cesiumContainer, {
    useDefaultRenderLoop: false,
    selectionIndicator: false,
    homeButton: false,
    sceneModePicker: false,
    navigationHelpButton: false,
    infoBox: false,
    animation: false,
    timeline: false,
    fullscreenButton: false,
    baseLayerPicker: false,
    geocoder: false,
    terrainShadows: Cesium.ShadowMode.DISABLED,
    targetFrameRate: 60,
    terrainProvider: new Cesium.EllipsoidTerrainProvider(),
    contextOptions: {
      webgl: {
        alpha: false,
        antialias: true,
        preserveDrawingBuffer: true,
        failIfMajorPerformanceCaveat: false,
        depth: true,
        stencil: false
      }
    },
    orderIndependentTranslucency: true
  });

  const scene = cesiumViewer.scene;
  scene.screenSpaceCameraController.enableTilt = false;
  scene.globe.depthTestAgainstTerrain = true;
  scene.highDynamicRange = false;
  scene.useDepthPicking = false;

  // ✅ Nền mặc định là 'none'
  setBasemap('none', cesiumViewer);

  // ✅ Ẩn loading khi Cesium render xong
  let hasRendered = false;
  scene.postRender.addEventListener(() => {
    if (hasRendered) return;

    const gl = scene.canvas.getContext('webgl') || scene.canvas.getContext('experimental-webgl');
    const pixels = new Uint8Array(4);
    gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixels);

    const isBlank = pixels.every(v => v === 0);
    if (!isBlank) {
      document.getElementById('loading-overlay').style.display = 'none';
      hasRendered = true;
    }
  });

  return cesiumViewer;
}


export async function setBasemap(type, cesiumViewer) {
  const scene = cesiumViewer.scene;

  const providers = {
    streets: new Cesium.OpenStreetMapImageryProvider({
      url: 'https://a.tile.openstreetmap.org/',
      maximumLevel: 18
    }),
    hybrid: Cesium.createWorldImagery(),
  };

  cesiumViewer.imageryLayers.removeAll();

  if (type === 'none') {
    scene.sun.show = false;
    scene.skyAtmosphere.show = false;
    scene.skyBox.show = false;
    scene.globe.show = false; // 🔑 tắt globe
    scene.backgroundColor = new Cesium.Color(0.15, 0.15, 0.15, 0.0);
    return;
  } else {
    // Khôi phục lại globe và trời khi chuyển về base map bình thường
    scene.globe.show = true;
    scene.skyAtmosphere.show = true;
    scene.backgroundColor = Cesium.Color.BLACK;
  }

  const imageryProvider = providers[type];
  if (!imageryProvider) {
    console.warn("Unknown basemap:", type);
    return;
  }

  cesiumViewer.imageryLayers.addImageryProvider(imageryProvider);
}
