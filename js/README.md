# Estrutura Modular do Projeto

Este projeto foi refatorado em módulos para melhor organização e manutenibilidade.

## Estrutura de Pastas

```
js/
├── core/           # Componentes principais (Scene, Camera, Renderer)
├── systems/        # Sistemas de funcionalidades (Luzes, Skybox, Terreno, etc)
├── utils/          # Utilitários (Texturas, Helpers)
└── ui/             # Interface do usuário (GUI)
```

## Módulos

### Core
- **Scene.js**: Gerencia cena, câmera, renderer e controles

### Systems
- **LightingSystem.js**: Sistema de iluminação e show de luzes
- **SkyboxSystem.js**: Sistema de skybox e transição dia/noite
- **TerrainSystem.js**: Sistema de terreno e funções de ruído
- **TrackSystem.js**: Sistema de trilhas (GroundData)
- **GrassSystem.js**: Sistema de grama infinita
- **ModelLoader.js**: Carregamento e processamento de modelos 3D

### Utils
- **TextureUtils.js**: Utilitários para criação de texturas procedurais

### UI
- **GUI.js**: Interface gráfica de controles

## Como usar

O arquivo `main.js` principal importa e inicializa todos os módulos.

