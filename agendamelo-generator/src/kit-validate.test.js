// Tests del cerebro de precios: la lista blanca de kit-validate.js y el contenido de los dos prompts
// (modo KIT y modo IMAGEN). Runner nativo de Node, sin dependencias: `npm test`.
//
// Lo que protegen: que el bot solo pueda decir los precios públicos vigentes, que "gratis" aparezca
// en los 7 días iniciales o en Perfil Gratis, y que los precios muertos no vuelvan nunca.

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { validateKit, findPriceIssues } from './kit-validate.js';
import { buildKitPrompt } from './kit-prompt.js';
import { buildPrompt } from './prompt.js';
import { PRECIOS_AGENDAMELO, PRECIOS_MUERTOS, PRICING_CANONICO } from './kit-config.js';

const SRC = dirname(fileURLToPath(import.meta.url));
const ROOT = join(SRC, '..');

// Kit mínimo válido: solo se le cambia el campo bajo prueba, así el error que aparece es el que
// estamos buscando y no ruido de otras reglas.
const kitBase = (extra = {}) => ({
  niche: 'manicuristas',
  keyword: 'agenda para manicuristas',
  hookText: 'Tu *agenda para manicuristas* vive en WhatsApp y duele.',
  scenes: ['Cada semana cuadras las horas de cero.'],
  ctaText: 'Búscalo: agendamelo.cl',
  captionSEO: 'Agenda para manicuristas en Chile 💅 ordena tus mantenciones sin WhatsApp',
  hashtags: ['#manicurista', '#unaschile', '#semipermanente'],
  imagePrompts: ['primer plano de uñas semipermanentes recién hechas'],
  angulo: 'tiempo',
  tema: 'agenda-whatsapp',
  ...extra,
});

// Ayuda a leer los fallos: devuelve los errores que hablan de precio/oferta/idioma.
const erroresDe = (kit) => validateKit(kit);

describe('kit base', () => {
  test('el kit de control no tiene errores (si esto falla, el resto es ruido)', () => {
    assert.deepEqual(erroresDe(kitBase()), []);
  });
});

describe('lo que SÍ se puede decir', () => {
  test('CTA con el trial de 7 días sin tarjeta', () => {
    const e = erroresDe(kitBase({ ctaText: 'Publica gratis 7 días, sin tarjeta -> agendamelo.cl' }));
    assert.deepEqual(e, []);
  });

  test('"7 días gratis" en el otro orden también vale', () => {
    assert.deepEqual(findPriceIssues('Publícalo 7 días gratis, sin tarjeta'), []);
  });

  test('el precio mensual vigente', () => {
    const e = erroresDe(kitBase({
      captionSEO: 'Agenda para manicuristas en Chile 💅 tu sitio propio por $12.990/mes',
    }));
    assert.deepEqual(e, []);
  });

  test('el plan anual vigente', () => {
    const e = erroresDe(kitBase({
      captionSEO: 'Agenda para manicuristas en Chile 💅 con plan anual $64.000 al año',
    }));
    assert.deepEqual(e, []);
  });

  test('el plan Web Pro vigente', () => {
    const e = erroresDe(kitBase({
      captionSEO: 'Agenda para manicuristas en Chile 💅 Web Pro por $19.990/mes',
    }));
    assert.deepEqual(e, []);
  });

  test('Perfil Gratis es una oferta pública real', () => {
    assert.deepEqual(findPriceIssues('Si no activas, quedas en Perfil Gratis sin agenda online.'), []);
  });

  test('los precios de MERCADO del rubro siguen permitidos (son la materia prima de los hooks)', () => {
    // niches.js alimenta el prompt con estos rangos; prohibirlos rompería la línea editorial.
    assert.deepEqual(findPriceIssues('Cobras $8.000 la manicure. El mercado paga $12.000–$18.000.'), []);
    assert.deepEqual(findPriceIssues('Una sesión de 45 min va entre $20.000 y $50.000.'), []);
  });

  test('un porcentaje que NO es descuento (dato de mercado) pasa', () => {
    assert.deepEqual(findPriceIssues('La sesión online sale 10–15% más económica.'), []);
  });
});

describe('precios muertos y cifras inventadas', () => {
  test('$4.990 en el ctaText falla', () => {
    const e = erroresDe(kitBase({ ctaText: 'Publica desde $4.990/mes -> agendamelo.cl' }));
    assert.ok(e.some((x) => x.includes('4.990')), `esperaba error por 4.990, hubo: ${JSON.stringify(e)}`);
  });

  test('$7.990 falla igual que $4.990', () => {
    assert.ok(findPriceIssues('luego $7.990/mes').length > 0);
  });

  test('una cifra inventada presentada como precio de Agendamelo falla', () => {
    const p = findPriceIssues('Tu sitio por $9.990 al mes');
    assert.ok(p.some((x) => x.includes('precio de Agendamelo')), JSON.stringify(p));
  });

  test('una cifra rara suelta (ni oficial ni de mercado) falla', () => {
    assert.ok(findPriceIssues('Te sale $9.990 y listo').length > 0);
  });
});

describe('"gratis" solo en Perfil Gratis o en los 7 días', () => {
  test('"primer mes gratis" falla', () => {
    const e = erroresDe(kitBase({ hookText: 'Tu *agenda para manicuristas* con primer mes gratis' }));
    assert.ok(e.some((x) => x.includes('primer mes gratis')), JSON.stringify(e));
  });

  test('"mes gratis" falla', () => {
    assert.ok(findPriceIssues('Aprovecha el mes gratis').length > 0);
  });

  test('"prueba gratis" falla', () => {
    assert.ok(findPriceIssues('Empieza con una prueba gratis').length > 0);
  });

  test('"gratis" suelto falla', () => {
    const p = findPriceIssues('Agendamelo es gratis');
    assert.ok(p.some((x) => x.includes('suelto')), JSON.stringify(p));
  });

  test('"trial" es anglicismo y falla', () => {
    const e = erroresDe(kitBase({ ctaText: 'Activa tu trial de 7 días -> agendamelo.cl' }));
    assert.ok(e.some((x) => x.includes('trial')), JSON.stringify(e));
  });
});

describe('lenguaje de oferta', () => {
  test('"50% de descuento" falla', () => {
    const e = erroresDe(kitBase({
      captionSEO: 'Agenda para manicuristas en Chile 💅 con 50% de descuento este mes',
    }));
    assert.ok(e.some((x) => x.includes('descuento')), JSON.stringify(e));
  });

  for (const palabra of ['oferta', 'promoción', 'cupón', '2x1', 'rebaja']) {
    test(`"${palabra}" falla`, () => {
      assert.ok(findPriceIssues(`Aprovecha esta ${palabra} de lanzamiento`).length > 0);
    });
  }
});

describe('campos que antes quedaban fuera de la validación', () => {
  test('scenes[0] con $4.990 falla', () => {
    const e = erroresDe(kitBase({ scenes: ['Cada semana cuadras horas y pagas $4.990 al mes.'] }));
    assert.ok(e.some((x) => x.startsWith('scene[0]')), JSON.stringify(e));
  });

  test('imagePrompts[0] con "gratis" suelto falla', () => {
    const e = erroresDe(kitBase({ imagePrompts: ['cartel que dice agenda gratis para siempre'] }));
    assert.ok(e.some((x) => x.startsWith('imagePrompt[0]')), JSON.stringify(e));
  });
});

describe('idioma (no-regresión)', () => {
  test('voseo argentino en el hook falla', () => {
    const e = erroresDe(kitBase({ hookText: 'Si tenés *agenda para manicuristas* en WhatsApp, perdés' }));
    assert.ok(e.some((x) => x.includes('voseo argentino')), JSON.stringify(e));
  });
});

// ---------------------------------------------------------------------------------------------
// No quedan precios muertos en el código ni en la documentación del generador.
//
// MARCADOR DE EXCEPCIÓN: una línea que contenga "[precio-historico]" queda exenta. Sirve para
// documentar en un changelog qué se cobraba antes sin que el test lo confunda con copy vivo.
// Hoy no hay ninguna: la exención existe para no obligar a borrar historia si algún día se escribe.
// ---------------------------------------------------------------------------------------------
const MARCADOR_HISTORICO = '[precio-historico]';

function archivosDeTexto(dir, exts, acc = []) {
  for (const it of readdirSync(dir, { withFileTypes: true })) {
    if (it.name === 'node_modules' || it.name === 'dist' || it.name.startsWith('.')) continue;
    const p = join(dir, it.name);
    if (it.isDirectory()) archivosDeTexto(p, exts, acc);
    else if (exts.some((x) => it.name.endsWith(x))) acc.push(p);
  }
  return acc;
}

describe('no quedan precios muertos', () => {
  test('ni en src/*.js ni en docs/*.md del generador', () => {
    const archivos = [...archivosDeTexto(SRC, ['.js']), ...archivosDeTexto(join(ROOT, 'docs'), ['.md'])];
    const sospechas = [];
    for (const f of archivos) {
      // Este mismo test nombra los precios muertos a propósito.
      if (f.endsWith('kit-validate.test.js')) continue;
      readFileSync(f, 'utf8').split('\n').forEach((linea, i) => {
        if (linea.includes(MARCADOR_HISTORICO)) return;
        // kit-config.js declara PRECIOS_MUERTOS: es la lista negra, no copy.
        if (f.endsWith('kit-config.js') && linea.includes('PRECIOS_MUERTOS')) return;
        if (/4\.?990|7\.?990/.test(linea)) sospechas.push(`${f.replace(ROOT, '.')}:${i + 1}: ${linea.trim()}`);
      });
    }
    assert.deepEqual(sospechas, [], `precios muertos vivos:\n${sospechas.join('\n')}`);
  });
});

describe('contenido de los prompts', () => {
  const kitPrompt = buildKitPrompt({ n: 2, niche: 'manicuristas', avoid: [] });
  const imgPrompt = buildPrompt({
    n: 2,
    nicheMix: { manicuristas: 2 },
    orientacionMix: { venta: 2 },
    formatoMix: { imagen: 2 },
    templateMix: { antes_despues: 2 },
    avoid: [],
  });

  for (const [nombre, p] of [['kit', kitPrompt], ['imagen', imgPrompt]]) {
    test(`el prompt de ${nombre} trae el precio vigente y el trial`, () => {
      for (const precio of PRECIOS_AGENDAMELO) {
        assert.ok(p.includes(precio), `falta $${precio} en el prompt de ${nombre}`);
      }
      assert.ok(p.includes('7 días'), `falta el trial de 7 días en el prompt de ${nombre}`);
      assert.ok(/sin tarjeta/i.test(p), `falta "sin tarjeta" en el prompt de ${nombre}`);
    });

    test(`el prompt de ${nombre} no trae precios muertos ni "no es prueba gratis"`, () => {
      for (const muerto of PRECIOS_MUERTOS) {
        assert.ok(!p.includes(muerto), `el prompt de ${nombre} todavía dice $${muerto}`);
      }
      assert.ok(!/no es prueba gratis/i.test(p), `el prompt de ${nombre} todavía dice "no es prueba gratis"`);
    });

    test(`el prompt de ${nombre} no menciona el plan fundador (es solo outreach por DM)`, () => {
      assert.ok(!/49\.?990|fundador/i.test(p), `el prompt de ${nombre} menciona el plan fundador`);
    });
  }

  test('la verdad canónica está armada con las cifras vigentes', () => {
    for (const precio of PRECIOS_AGENDAMELO) assert.ok(PRICING_CANONICO.includes(precio));
    assert.ok(/(?:gratis\s+7\s+días|7\s+días\s+gratis)/i.test(PRICING_CANONICO));
    assert.ok(/Perfil Gratis/i.test(PRICING_CANONICO));
  });
});
