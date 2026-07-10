#!/usr/bin/env node
// verify-traceability.js — Comprueba que cada historia de usuario en
// docs/user-stories/ sigue mapeada a artefactos reales de las 8 etapas
// del ciclo DevOps (plan, code, build, test, release, deploy, operate,
// monitor) y que los archivos de test referenciados citan el ID de la
// historia. Si alguien edita una historia a mano (agrega/quita un
// endpoint, un criterio de aceptación, una ruta) y el resto del ciclo
// no se actualiza en consecuencia, este check falla y bloquea el CI.

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const STORIES_DIR = path.join(ROOT, 'docs', 'user-stories');
const STAGES = ['plan', 'code', 'build', 'test', 'release', 'deploy', 'operate', 'monitor'];
const REQUIRED_SCALARS = ['id', 'title', 'status', 'persona', 'i_want', 'so_that'];

function parseFrontmatter(content, file) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) throw new Error(`${file}: no se encontró frontmatter YAML (---...---)`);

  const data = {};
  let currentKey = null;

  for (const rawLine of match[1].split(/\r?\n/)) {
    if (!rawLine.trim()) continue;

    const listItem = rawLine.match(/^\s*-\s+(.*)$/);
    if (listItem) {
      if (!currentKey || !Array.isArray(data[currentKey])) {
        throw new Error(`${file}: item de lista fuera de una clave de lista válida: "${rawLine}"`);
      }
      data[currentKey].push(listItem[1].trim());
      continue;
    }

    const kv = rawLine.match(/^([a-zA-Z_]+):\s*(.*)$/);
    if (!kv) throw new Error(`${file}: línea de frontmatter inválida: "${rawLine}"`);

    const [, key, value] = kv;
    if (value.trim() === '') {
      data[key] = [];
      currentKey = key;
    } else {
      data[key] = value.trim();
      currentKey = null;
    }
  }

  return data;
}

function fail(errors) {
  console.error('\n✗ Traceability check FAILED\n');
  for (const e of errors) console.error(`  - ${e}`);
  console.error(`\n${errors.length} problema(s). Corrige docs/user-stories/*.md o los artefactos enlazados.\n`);
  process.exit(1);
}

function main() {
  if (!fs.existsSync(STORIES_DIR)) {
    fail([`No existe el directorio ${path.relative(ROOT, STORIES_DIR)}`]);
  }

  const files = fs.readdirSync(STORIES_DIR).filter(f => /^HU-\d+.*\.md$/.test(f));
  if (files.length === 0) {
    fail(['No se encontró ninguna historia de usuario (docs/user-stories/HU-*.md)']);
  }

  const errors = [];
  const seenIds = new Map();

  for (const file of files) {
    const relFile = path.join('docs', 'user-stories', file);
    const fullPath = path.join(STORIES_DIR, file);
    const content = fs.readFileSync(fullPath, 'utf8');

    let data;
    try {
      data = parseFrontmatter(content, relFile);
    } catch (e) {
      errors.push(e.message);
      continue;
    }

    for (const key of REQUIRED_SCALARS) {
      if (!data[key] || typeof data[key] !== 'string') {
        errors.push(`${relFile}: falta el campo obligatorio "${key}"`);
      }
    }

    if (data.acceptance === undefined || !Array.isArray(data.acceptance) || data.acceptance.length === 0) {
      errors.push(`${relFile}: falta "acceptance" con al menos un criterio de aceptación`);
    }

    if (data.id) {
      if (!/^HU-\d+$/.test(data.id)) {
        errors.push(`${relFile}: "id" debe tener formato HU-NN, encontrado "${data.id}"`);
      } else if (seenIds.has(data.id)) {
        errors.push(`${relFile}: id "${data.id}" duplicado (también en ${seenIds.get(data.id)})`);
      } else {
        seenIds.set(data.id, relFile);
      }
      if (!file.startsWith(data.id)) {
        errors.push(`${relFile}: el nombre de archivo debe empezar con "${data.id}"`);
      }
    }

    for (const stage of STAGES) {
      const links = data[stage];
      if (!Array.isArray(links) || links.length === 0) {
        errors.push(`${relFile}: la etapa "${stage}" no tiene ningún artefacto enlazado`);
        continue;
      }
      for (const link of links) {
        const linkedPath = path.join(ROOT, link);
        if (!fs.existsSync(linkedPath)) {
          errors.push(`${relFile}: [${stage}] el archivo enlazado no existe: ${link}`);
          continue;
        }
        if (stage === 'test' && link.endsWith('.test.js')) {
          const testContent = fs.readFileSync(linkedPath, 'utf8');
          if (data.id && !testContent.includes(data.id)) {
            errors.push(
              `${relFile}: [test] ${link} existe pero no menciona "${data.id}" — ` +
              `el test debe citar el ID de la historia para mantener la trazabilidad`
            );
          }
        }
      }
    }
  }

  if (errors.length > 0) fail(errors);

  console.log(`✓ Traceability check OK — ${files.length} historia(s) de usuario verificadas contra las 8 etapas del ciclo DevOps.`);
  for (const [id, file] of seenIds) console.log(`  ${id}  →  ${file}`);
}

main();
