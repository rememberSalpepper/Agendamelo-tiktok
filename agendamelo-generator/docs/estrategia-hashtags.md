# Estrategia de hashtags Agendamelo

Máximo **5 hashtags** por post (límite real de TikTok). Mezcla obligatoria:

| Slot | Rol | Por qué |
|------|-----|---------|
| 1 | **Marca**: `#agendamelo` | Construye tu hub de contenido; toda tu marca bajo un tag. |
| 2 | **Amplio** (alcance) | El de mayor volumen relevante: `#emprendimiento`, `#negocios`. Da distribución. |
| 3-4 | **Rubro / tema** (relevancia) | Específicos del nicho y tema EXACTO del post. Mejor distribución al público correcto. |
| 5 | **Local / intención** | Apunta a dueños de negocios en Chile: `#pymeschile`, `#emprendedoreschile`, `#clientes`. |

## Reglas
- Los hashtags deben reflejar **de qué habla la publicación** y **a qué rubro** apunta.
- Priorizar los que den **mayor visibilidad o probabilidad de conversión**.
- `#agendamelo` siempre presente (marca).
- Sin relleno ni spam: 5 que trabajen, no 30 genéricos.

## Pools
- **Amplios**: `#emprendimiento #negocios #marketingparanegocios`
- **Rubro**: `#barberia #peluqueria #manicure #estetica #tatuajes #veterinaria #nutricion #psicologia #dentista`
- **Tema/producto**: `#agendaonline #reservas #recordatorios #paginaweb #apareceengoogle`
- **Local / intención**: `#pymeschile #emprendedoreschile #clientes`
- **Marca**: `#agendamelo`

## Cómo se eligen
El generador (`src/prompt.js`) pide 5 tags que reflejen el tema y el rubro del post, y
`src/generate.js` fuerza `#agendamelo` y rellena desde los pools si faltan, sin duplicar.
