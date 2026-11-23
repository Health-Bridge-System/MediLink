# MediLink imaging

DICOM viewer code, kept separate from the main React UI as agreed in the
project code style. The frontend imports it through the `@imaging` alias
(see `frontend/vite.config.js`).

```
imaging/
└── viewer/
    ├── DicomViewer.jsx     viewer component: window/level, zoom, pan, rotate,
    │                       invert, slice scrolling, length measurement
    └── syntheticImage.js   generated grayscale test images (no patient data)
```

## Libraries

| Library | Version | Used for |
|---|---|---|
| React | 19.x (from `frontend/`) | Viewer component |
| GSAP | 3.15.x (from `frontend/`) | Image fade-in when switching series |

## Next steps

- Store studies in **Orthanc** and read them through **DICOMweb**.
- Replace `syntheticImage.js` with **Cornerstone3D** (`@cornerstonejs/core`,
  `@cornerstonejs/tools`, `@cornerstonejs/dicom-image-loader`) for real DICOM,
  MPR and 3D volume rendering. Record each package and its version here.
- Use anonymized sample data only; never commit real patient DICOM files.
