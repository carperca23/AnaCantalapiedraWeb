// Copies + renames images from the raw asset archive (../../web_ana) into
// src/assets, so the Astro project never touches the original files.
// Safe to re-run: it always re-copies from source, so new/changed photos
// dropped into a source folder will show up after re-running this script.

import { readdirSync, existsSync, mkdirSync, copyFileSync, rmSync } from 'node:fs';
import { join, extname, basename, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SOURCE_ROOT = join(__dirname, '..', '..', 'web_ana');
const DEST_PROYECTOS = join(__dirname, '..', 'src', 'assets', 'proyectos');
const DEST_HOME = join(__dirname, '..', 'src', 'assets', 'home');
const DEST_SOBRE_MI = join(__dirname, '..', 'src', 'assets', 'sobre-mi');

const IMAGE_EXT = new Set(['.jpg', '.jpeg', '.png']);

// carpeta origen (identificada por prefijo numérico + sufijo "B") -> slug del proyecto
const SLUG_BY_PREFIX = {
	'1': 'arquitecturas-desmontables',
	'2': 'los-vacios-de-la-historia',
	'3': 'deslumbrame',
	'4': 'azahar',
	'5': 'sentimientos-en-conserva',
	'6': 'la-mirada-congelada',
	'7': 'la-nube-atrapada',
	'8': 'sin-piel',
	'9': 'quedarse-en-blanco',
	'10': 'rehacerme',
	'1B': 'con-la-cabeza-en-las-nubes',
	'2B': 'los-pajaros-suenan-que-andan',
	'3B': 'dibujo',
};

const COMBINING_MARKS = new RegExp('[\\u0300-\\u036f]', 'g');

function slugifyStem(name) {
	return name
		.normalize('NFD')
		.replace(COMBINING_MARKS, '')
		.replace(/[^a-zA-Z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '')
		.toLowerCase();
}

function resetDir(dir) {
	if (existsSync(dir)) rmSync(dir, { recursive: true, force: true });
	mkdirSync(dir, { recursive: true });
}

function importNumberedProject(sourceDir, destDir) {
	const files = readdirSync(sourceDir).filter((f) => IMAGE_EXT.has(extname(f).toLowerCase()));
	const withIndex = files
		.map((f) => {
			const match = f.match(/^(\d+)_/);
			return { file: f, index: match ? Number(match[1]) : Number.POSITIVE_INFINITY };
		})
		.sort((a, b) => a.index - b.index || a.file.localeCompare(b.file));

	resetDir(destDir);
	withIndex.forEach(({ file }, i) => {
		const ext = extname(file).toLowerCase();
		const outName = `${String(i + 1).padStart(2, '0')}${ext}`;
		copyFileSync(join(sourceDir, file), join(destDir, outName));
	});
	return withIndex.length;
}

function importNamedPieces(sourceDir, destDir) {
	const files = readdirSync(sourceDir).filter((f) => IMAGE_EXT.has(extname(f).toLowerCase()));
	resetDir(destDir);
	files.forEach((file) => {
		const ext = extname(file).toLowerCase();
		const stem = slugifyStem(basename(file, extname(file)));
		copyFileSync(join(sourceDir, file), join(destDir, `${stem}${ext}`));
	});
	return files.length;
}

function main() {
	const entries = readdirSync(SOURCE_ROOT, { withFileTypes: true }).filter((e) => e.isDirectory());

	let total = 0;
	for (const entry of entries) {
		const match = entry.name.match(/^(\d+B?)_/);
		if (!match) continue; // "Pagina de entrada" / "Sobre mi" handled separately below
		const prefix = match[1];
		const slug = SLUG_BY_PREFIX[prefix];
		if (!slug) {
			console.warn(`⚠ carpeta sin mapeo de slug: ${entry.name}`);
			continue;
		}
		const sourceDir = join(SOURCE_ROOT, entry.name);
		const destDir = join(DEST_PROYECTOS, slug);
		const count =
			slug === 'dibujo'
				? importNamedPieces(sourceDir, destDir)
				: importNumberedProject(sourceDir, destDir);
		console.log(`✔ ${slug}: ${count} imágenes`);
		total += count;
	}

	// Home hero — the flat composite (wide screens) plus the two source
	// halves that make it up (stacked on narrow screens, see hero-split.astro)
	resetDir(DEST_HOME);
	copyFileSync(join(SOURCE_ROOT, 'Pagina de entrada', 'Pag_Principal.jpg'), join(DEST_HOME, 'hero.jpg'));
	copyFileSync(join(SOURCE_ROOT, 'Pagina de entrada', 'Nubetela 1.jpg'), join(DEST_HOME, 'hero-foto.jpg'));
	copyFileSync(
		join(SOURCE_ROOT, 'Pagina de entrada', '1A_LosPajarossuenanqueandan.jpg'),
		join(DEST_HOME, 'hero-ilustracion.jpg'),
	);
	console.log('✔ home: 3 imágenes');
	total += 3;

	// Sobre mí portrait
	resetDir(DEST_SOBRE_MI);
	copyFileSync(join(SOURCE_ROOT, 'Sobre mi', 'Ana1.jpg'), join(DEST_SOBRE_MI, 'retrato.jpg'));
	console.log('✔ sobre-mi: 1 imagen');
	total += 1;

	console.log(`\nTotal copiado: ${total} imágenes`);
}

main();
