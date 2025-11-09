#!/usr/bin/env node

import { writeFile } from 'fs/promises';
import path from 'path';
import process from 'process';

import { FIGMA_FILE_ID } from '../config/figma.config.js';

const FIGMA_API_BASE = 'https://api.figma.com/v1';
const OUTPUT_PATH = path.resolve(process.cwd(), 'libs/theme.tokens.js');

const FIGMA_TOKEN = process.env.FIGMA_TOKEN;

if (!FIGMA_TOKEN) {
  console.error('❌ FIGMA_TOKEN no está definido.');
  process.exit(1);
}

const fetchJson = async (url) => {
  const response = await fetch(url, {
    headers: {
      'X-Figma-Token': FIGMA_TOKEN,
    },
  });

  if (!response.ok) {
    const fallback = await response.text();
    throw new Error(`Figma API error (${response.status}): ${fallback}`);
  }

  return response.json();
};

const extractPaintStyle = (paint) => {
  if (!paint || paint.type !== 'SOLID') return null;

  const { color, opacity = 1 } = paint;
  const r = Math.round(color.r * 255);
  const g = Math.round(color.g * 255);
  const b = Math.round(color.b * 255);
  const a = opacity;

  if (a === 1) {
    return `#${[r, g, b]
      .map((value) => value.toString(16).padStart(2, '0'))
      .join('')}`;
  }

  return `rgba(${r}, ${g}, ${b}, ${a.toFixed(2)})`;
};

const run = async () => {
  console.log('🎨 Sincronizando tokens desde Figma...');

  const stylesResponse = await fetchJson(`${FIGMA_API_BASE}/files/${FIGMA_FILE_ID}/styles`);
  const colorStyles = stylesResponse.meta?.styles?.filter((style) => style.style_type === 'FILL');

  if (!colorStyles?.length) {
    console.warn('⚠️ No se encontraron estilos de color como estilos legacy en el archivo de Figma. Se intentará usar variables.');
  }

  const nodeIds = colorStyles?.map((style) => style.node_id) || [];
  const nodesResponse = nodeIds.length
    ? await fetchJson(
        `${FIGMA_API_BASE}/files/${FIGMA_FILE_ID}/nodes?ids=${encodeURIComponent(nodeIds.join(','))}`
      )
    : { nodes: {} };

  const surfaces = {};
  const palette = {};

  colorStyles?.forEach((style) => {
    const node = nodesResponse.nodes?.[style.node_id]?.document;
    const fills = node?.fills;
    if (!fills?.length) return;

    const solid = extractPaintStyle(fills[0]);
    if (!solid) return;

    const name = style.name.toLowerCase();
    if (name.includes('surface')) {
      surfaces[name.replace('surface/', '').trim()] = solid;
    } else {
      palette[name.replace('color/', '').trim()] = solid;
    }
  });

  // Intentar obtener variables locales (Figma Tokens)
  try {
    const variablesResponse = await fetchJson(
      `${FIGMA_API_BASE}/files/${FIGMA_FILE_ID}/variables/local`
    );

    const variables = variablesResponse.meta?.variables ?? [];
    const collections = variablesResponse.meta?.variableCollections ?? [];
    const variableMap = new Map(variables.map((variable) => [variable.id, variable]));

    const resolveVariableColor = (variable, modeId, visited = new Set()) => {
      if (!variable) return null;

      const collection = collections.find((item) => item.id === variable.variableCollectionId);
      const defaultModeId = modeId || collection?.defaultModeId;
      const modeToUse = defaultModeId || Object.keys(variable.valuesByMode || {})[0];
      const value = variable.valuesByMode?.[modeToUse];

      return resolveColorValue(value, modeToUse, new Set(visited));
    };

    const resolveColorValue = (value, modeId, visited = new Set()) => {
      if (!value) return null;

      if (typeof value === 'object' && value.type === 'VARIABLE_ALIAS') {
        const targetId = value.id || value.aliasId || value.variableId;
        if (!targetId || visited.has(targetId)) {
          return null;
        }

        visited.add(targetId);
        const targetVariable = variableMap.get(targetId);
        if (!targetVariable) return null;

        return resolveVariableColor(targetVariable, modeId, visited);
      }

      if (typeof value === 'object' && value.r !== undefined) {
        const { r, g, b, a = 1 } = value;
        const rr = Math.round(r * 255);
        const gg = Math.round(g * 255);
        const bb = Math.round(b * 255);

        if (a >= 1) {
          return `#${[rr, gg, bb]
            .map((channel) => channel.toString(16).padStart(2, '0'))
            .join('')}`;
        }

        return `rgba(${rr}, ${gg}, ${bb}, ${a.toFixed(2)})`;
      }

      return null;
    };

    variables
      .filter((variable) => variable.resolvedType === 'COLOR')
      .forEach((variable) => {
        const colorValue = resolveVariableColor(variable);
        if (!colorValue) return;

        const normalizedName = variable.name.toLowerCase();

        if (normalizedName.includes('surface')) {
          surfaces[normalizedName.replace(/.*surface[\/_]?/, '').trim() || 'base'] = colorValue;
        } else if (normalizedName.includes('background')) {
          surfaces[normalizedName.replace(/.*background[\/_]?/, '').trim() || 'background'] = colorValue;
        } else {
          palette[normalizedName.replace(/.*color[\/_]?/, '').trim() || normalizedName] = colorValue;
        }
      });

    console.log(
      `🎯 Variables de color sincronizadas: ${variables.filter(
        (variable) => variable.resolvedType === 'COLOR'
      ).length}`
    );
  } catch (error) {
    console.warn('⚠️ No fue posible obtener variables de Figma:', error.message);
  }

  const tokens = {
    updatedAt: new Date().toISOString(),
    palette,
    surfaces,
  };

  const fileContents = `export const figmaTokens = ${JSON.stringify(tokens, null, 2)};

export default figmaTokens;
`;

  await writeFile(OUTPUT_PATH, fileContents, 'utf8');

  console.log(`✅ Tokens guardados en ${OUTPUT_PATH}`);
};

run().catch((error) => {
  console.error('❌ No se pudo sincronizar con Figma:', error.message);
  process.exit(1);
});


