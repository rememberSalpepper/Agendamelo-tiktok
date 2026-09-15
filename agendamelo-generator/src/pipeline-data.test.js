import { describe, test } from 'node:test';
import assert from 'node:assert/strict';

import { rowToData } from './pipeline-data.js';

describe('datos para render', () => {
  test('usa el hook curado como titular de una imagen', () => {
    const data = rowToData({
      id: 'AGENDA-IDEA-002',
      niche: 'manicuristas',
      tipo_plantilla: 'stat',
      hook: 'Gancho *curado*',
      imagen_json: JSON.stringify({ hook: 'Gancho preliminar', figure: '3 datos' }),
    });

    assert.equal(data.hook, 'Gancho *curado*');
  });

  test('usa el hook curado en la portada de un carrusel', () => {
    const data = rowToData({
      id: 'AGENDA-IDEA-004',
      niche: 'manicuristas',
      tipo_plantilla: 'carrusel',
      hook: 'Portada *curada*',
      imagen_json: JSON.stringify({
        slides: [
          { tipo: 'portada', hook: 'Portada preliminar' },
          { tipo: 'punto', title: 'Segundo slide' },
        ],
      }),
    });

    assert.equal(data.slides[0].hook, 'Portada *curada*');
    assert.equal(data.slides[1].title, 'Segundo slide');
  });
});
