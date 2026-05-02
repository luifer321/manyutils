#!/usr/bin/env node
/**
 * Adds locale entries for the 18 new tools + supporting common keys + 2 new
 * categories (media, audio) to en/fr/es/de/pt.
 *
 * Idempotent: re-running will just no-op for keys that already exist.
 *
 *   node scripts/_gen-locales.js
 */
'use strict';

const fs   = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');

// ── Shared additions across all 5 locales ──────────────────────────────────

const NEW_CATEGORIES = {
  en: { media: 'Media',           audio: 'Audio'   },
  fr: { media: 'Médias',          audio: 'Audio'   },
  es: { media: 'Multimedia',      audio: 'Audio'   },
  de: { media: 'Medien',          audio: 'Audio'   },
  pt: { media: 'Mídia',           audio: 'Áudio'   },
};

const NEW_COMMON = {
  en: {
    drop_image_here: 'Drag & drop an image here',
    or_click_to_browse: 'or click to browse',
    drop_video_here: 'Drag & drop a video here',
    or_click_to_browse_video: 'or click to browse — MP4, MOV, WebM (max 100 MB, 30s)',
    original: 'Original',
    savings: 'Savings',
    format: 'Format',
    width: 'Width (px)',
    height: 'Height (px)',
    percent: 'Percent (%)',
    keep_aspect_ratio: 'Keep aspect ratio',
    resize: 'Resize Image',
    crop: 'Apply Crop',
    aspect_ratio: 'Aspect ratio',
    flip_horizontal: 'Flip ↔',
    flip_vertical: 'Flip ↕',
    custom_angle: 'Custom angle (degrees)',
    preview: 'Preview',
    trim_start: 'Start (s)',
    trim_end: 'End (s)',
    fps: 'FPS',
    convert_to_gif: 'Convert to GIF',
    audio_privacy_note: 'Your audio stays on your device. Processing happens locally in your browser.',
  },
  fr: {
    drop_image_here: 'Glissez-déposez une image ici',
    or_click_to_browse: 'ou cliquez pour parcourir',
    drop_video_here: 'Glissez-déposez une vidéo ici',
    or_click_to_browse_video: 'ou cliquez pour parcourir — MP4, MOV, WebM (max 100 Mo, 30s)',
    original: 'Original',
    savings: 'Économies',
    format: 'Format',
    width: 'Largeur (px)',
    height: 'Hauteur (px)',
    percent: 'Pourcentage (%)',
    keep_aspect_ratio: 'Conserver les proportions',
    resize: 'Redimensionner',
    crop: 'Appliquer le recadrage',
    aspect_ratio: 'Format',
    flip_horizontal: 'Retourner ↔',
    flip_vertical: 'Retourner ↕',
    custom_angle: 'Angle personnalisé (degrés)',
    preview: 'Aperçu',
    trim_start: 'Début (s)',
    trim_end: 'Fin (s)',
    fps: 'IPS',
    convert_to_gif: 'Convertir en GIF',
    audio_privacy_note: 'Votre audio reste sur votre appareil. Le traitement se fait localement dans votre navigateur.',
  },
  es: {
    drop_image_here: 'Arrastra y suelta una imagen aquí',
    or_click_to_browse: 'o haz clic para examinar',
    drop_video_here: 'Arrastra y suelta un vídeo aquí',
    or_click_to_browse_video: 'o haz clic para examinar — MP4, MOV, WebM (máx. 100 MB, 30s)',
    original: 'Original',
    savings: 'Ahorro',
    format: 'Formato',
    width: 'Ancho (px)',
    height: 'Alto (px)',
    percent: 'Porcentaje (%)',
    keep_aspect_ratio: 'Mantener proporción',
    resize: 'Redimensionar',
    crop: 'Aplicar recorte',
    aspect_ratio: 'Proporción',
    flip_horizontal: 'Voltear ↔',
    flip_vertical: 'Voltear ↕',
    custom_angle: 'Ángulo personalizado (grados)',
    preview: 'Vista previa',
    trim_start: 'Inicio (s)',
    trim_end: 'Fin (s)',
    fps: 'FPS',
    convert_to_gif: 'Convertir a GIF',
    audio_privacy_note: 'Tu audio permanece en tu dispositivo. El procesamiento ocurre localmente en tu navegador.',
  },
  de: {
    drop_image_here: 'Bild hier hineinziehen',
    or_click_to_browse: 'oder klicken zum Auswählen',
    drop_video_here: 'Video hier hineinziehen',
    or_click_to_browse_video: 'oder klicken zum Auswählen — MP4, MOV, WebM (max. 100 MB, 30s)',
    original: 'Original',
    savings: 'Ersparnis',
    format: 'Format',
    width: 'Breite (px)',
    height: 'Höhe (px)',
    percent: 'Prozent (%)',
    keep_aspect_ratio: 'Seitenverhältnis beibehalten',
    resize: 'Bild skalieren',
    crop: 'Zuschneiden',
    aspect_ratio: 'Seitenverhältnis',
    flip_horizontal: 'Horizontal spiegeln',
    flip_vertical: 'Vertikal spiegeln',
    custom_angle: 'Benutzerdefinierter Winkel (Grad)',
    preview: 'Vorschau',
    trim_start: 'Start (s)',
    trim_end: 'Ende (s)',
    fps: 'FPS',
    convert_to_gif: 'In GIF umwandeln',
    audio_privacy_note: 'Deine Audiodatei bleibt auf deinem Gerät. Die Verarbeitung erfolgt lokal in deinem Browser.',
  },
  pt: {
    drop_image_here: 'Arraste e solte uma imagem aqui',
    or_click_to_browse: 'ou clique para procurar',
    drop_video_here: 'Arraste e solte um vídeo aqui',
    or_click_to_browse_video: 'ou clique para procurar — MP4, MOV, WebM (máx. 100 MB, 30s)',
    original: 'Original',
    savings: 'Economia',
    format: 'Formato',
    width: 'Largura (px)',
    height: 'Altura (px)',
    percent: 'Porcentagem (%)',
    keep_aspect_ratio: 'Manter proporção',
    resize: 'Redimensionar',
    crop: 'Aplicar corte',
    aspect_ratio: 'Proporção',
    flip_horizontal: 'Inverter ↔',
    flip_vertical: 'Inverter ↕',
    custom_angle: 'Ângulo personalizado (graus)',
    preview: 'Pré-visualização',
    trim_start: 'Início (s)',
    trim_end: 'Fim (s)',
    fps: 'FPS',
    convert_to_gif: 'Converter para GIF',
    audio_privacy_note: 'Seu áudio permanece no seu dispositivo. O processamento acontece localmente no seu navegador.',
  },
};

// ── Per-tool name + description in all 5 languages ─────────────────────────

const TOOLS_I18N = {
  png_to_jpg: {
    en: { name: 'PNG to JPG Converter',  description: 'Convert PNG images to JPG (JPEG) directly in your browser — fast, free, no upload.' },
    fr: { name: 'Convertisseur PNG en JPG', description: 'Convertissez des images PNG en JPG (JPEG) directement dans votre navigateur — rapide, gratuit, sans téléchargement.' },
    es: { name: 'Convertidor PNG a JPG', description: 'Convierte imágenes PNG a JPG (JPEG) directamente en tu navegador — rápido, gratis, sin subir nada.' },
    de: { name: 'PNG zu JPG Konverter', description: 'Konvertiere PNG-Bilder direkt in deinem Browser zu JPG (JPEG) — schnell, kostenlos, kein Upload.' },
    pt: { name: 'Conversor PNG para JPG', description: 'Converta imagens PNG para JPG (JPEG) diretamente no seu navegador — rápido, grátis, sem upload.' },
  },
  jpg_to_png: {
    en: { name: 'JPG to PNG Converter',  description: 'Convert JPG (JPEG) images to lossless PNG in your browser — keep transparency support.' },
    fr: { name: 'Convertisseur JPG en PNG', description: 'Convertissez des images JPG (JPEG) en PNG sans perte dans votre navigateur — prise en charge de la transparence.' },
    es: { name: 'Convertidor JPG a PNG', description: 'Convierte imágenes JPG (JPEG) a PNG sin pérdida en tu navegador — admite transparencia.' },
    de: { name: 'JPG zu PNG Konverter', description: 'Konvertiere JPG (JPEG) Bilder im Browser verlustfrei zu PNG — mit Transparenz-Unterstützung.' },
    pt: { name: 'Conversor JPG para PNG', description: 'Converta imagens JPG (JPEG) para PNG sem perdas no seu navegador — com suporte a transparência.' },
  },
  png_to_webp: {
    en: { name: 'PNG to WebP Converter', description: 'Convert PNG to WebP — modern format with up to 30 % smaller files at the same quality.' },
    fr: { name: 'Convertisseur PNG en WebP', description: 'Convertissez PNG en WebP — format moderne avec des fichiers jusqu\'à 30 % plus petits à qualité égale.' },
    es: { name: 'Convertidor PNG a WebP', description: 'Convierte PNG a WebP — formato moderno hasta un 30 % más pequeño con la misma calidad.' },
    de: { name: 'PNG zu WebP Konverter', description: 'Konvertiere PNG zu WebP — modernes Format mit bis zu 30 % kleineren Dateien bei gleicher Qualität.' },
    pt: { name: 'Conversor PNG para WebP', description: 'Converta PNG para WebP — formato moderno até 30% menor com a mesma qualidade.' },
  },
  webp_to_png: {
    en: { name: 'WebP to PNG Converter', description: 'Convert WebP images to lossless PNG — works on any browser, no upload.' },
    fr: { name: 'Convertisseur WebP en PNG', description: 'Convertissez des images WebP en PNG sans perte — fonctionne dans tout navigateur, sans téléchargement.' },
    es: { name: 'Convertidor WebP a PNG', description: 'Convierte imágenes WebP a PNG sin pérdida — funciona en cualquier navegador, sin subir nada.' },
    de: { name: 'WebP zu PNG Konverter', description: 'Konvertiere WebP-Bilder verlustfrei zu PNG — funktioniert in jedem Browser, kein Upload.' },
    pt: { name: 'Conversor WebP para PNG', description: 'Converta imagens WebP para PNG sem perdas — funciona em qualquer navegador, sem upload.' },
  },
  webp_to_jpg: {
    en: { name: 'WebP to JPG Converter', description: 'Convert WebP images to widely-compatible JPG — useful for older email clients and apps.' },
    fr: { name: 'Convertisseur WebP en JPG', description: 'Convertissez des images WebP en JPG largement compatible — pratique pour les anciens clients de messagerie et applications.' },
    es: { name: 'Convertidor WebP a JPG', description: 'Convierte imágenes WebP a JPG ampliamente compatible — útil para clientes de correo y aplicaciones antiguas.' },
    de: { name: 'WebP zu JPG Konverter', description: 'Konvertiere WebP-Bilder ins weit kompatible JPG — nützlich für ältere E-Mail-Clients und Apps.' },
    pt: { name: 'Conversor WebP para JPG', description: 'Converta imagens WebP para JPG amplamente compatível — útil para clientes de e-mail e apps mais antigos.' },
  },
  jpg_to_webp: {
    en: { name: 'JPG to WebP Converter', description: 'Convert JPG to WebP for smaller, web-optimised images — great for blogs and product pages.' },
    fr: { name: 'Convertisseur JPG en WebP', description: 'Convertissez JPG en WebP pour des images plus petites et optimisées pour le web — idéal pour blogs et pages produit.' },
    es: { name: 'Convertidor JPG a WebP', description: 'Convierte JPG a WebP para imágenes más pequeñas y optimizadas para web — ideal para blogs y páginas de producto.' },
    de: { name: 'JPG zu WebP Konverter', description: 'Konvertiere JPG zu WebP für kleinere, web-optimierte Bilder — perfekt für Blogs und Produktseiten.' },
    pt: { name: 'Conversor JPG para WebP', description: 'Converta JPG para WebP para imagens menores e otimizadas para web — ótimo para blogs e páginas de produto.' },
  },
  svg_to_png: {
    en: { name: 'SVG to PNG Converter',  description: 'Rasterise SVG to high-quality PNG at any size — preserves transparency.' },
    fr: { name: 'Convertisseur SVG en PNG', description: 'Convertissez SVG en PNG haute qualité à n\'importe quelle taille — conserve la transparence.' },
    es: { name: 'Convertidor SVG a PNG', description: 'Convierte SVG a PNG de alta calidad en cualquier tamaño — conserva la transparencia.' },
    de: { name: 'SVG zu PNG Konverter',  description: 'Rastere SVG in hochwertiges PNG in jeder Größe — Transparenz bleibt erhalten.' },
    pt: { name: 'Conversor SVG para PNG', description: 'Rasterize SVG para PNG de alta qualidade em qualquer tamanho — preserva a transparência.' },
  },
  svg_to_jpg: {
    en: { name: 'SVG to JPG Converter',  description: 'Rasterise SVG to JPG with a chosen background colour — perfect for thumbnails and emails.' },
    fr: { name: 'Convertisseur SVG en JPG', description: 'Convertissez SVG en JPG avec une couleur d\'arrière-plan au choix — idéal pour vignettes et e-mails.' },
    es: { name: 'Convertidor SVG a JPG', description: 'Convierte SVG a JPG con un color de fondo elegido — perfecto para miniaturas y correos.' },
    de: { name: 'SVG zu JPG Konverter',  description: 'Rastere SVG in JPG mit gewählter Hintergrundfarbe — ideal für Thumbnails und E-Mails.' },
    pt: { name: 'Conversor SVG para JPG', description: 'Rasterize SVG para JPG com cor de fundo à escolha — perfeito para miniaturas e e-mails.' },
  },
  svg_to_webp: {
    en: { name: 'SVG to WebP Converter', description: 'Rasterise SVG to WebP for compact, modern raster images.' },
    fr: { name: 'Convertisseur SVG en WebP', description: 'Convertissez SVG en WebP pour des images raster modernes et compactes.' },
    es: { name: 'Convertidor SVG a WebP', description: 'Convierte SVG a WebP para imágenes raster modernas y compactas.' },
    de: { name: 'SVG zu WebP Konverter', description: 'Rastere SVG zu WebP für kompakte, moderne Rasterbilder.' },
    pt: { name: 'Conversor SVG para WebP', description: 'Rasterize SVG para WebP para imagens rasterizadas modernas e compactas.' },
  },
  image_resizer: {
    en: { name: 'Image Resizer', description: 'Resize images by exact pixel dimensions or percentage with optional aspect-ratio lock.' },
    fr: { name: 'Redimensionneur d\'images', description: 'Redimensionnez des images par dimensions exactes ou pourcentage, avec verrouillage du rapport hauteur/largeur.' },
    es: { name: 'Redimensionador de imágenes', description: 'Redimensiona imágenes por dimensiones exactas o porcentaje, con bloqueo opcional de proporción.' },
    de: { name: 'Bildgrößen-Tool', description: 'Skaliere Bilder auf exakte Pixelmaße oder per Prozentwert, mit optionalem Seitenverhältnis-Sperre.' },
    pt: { name: 'Redimensionador de imagens', description: 'Redimensione imagens por pixels exatos ou porcentagem, com trava opcional de proporção.' },
  },
  crop_image: {
    en: { name: 'Crop Image', description: 'Crop images with drag-to-select, ratio presets (1:1, 4:3, 16:9), or pixel-precise inputs.' },
    fr: { name: 'Recadrer l\'image', description: 'Recadrez des images en sélectionnant à la souris, avec des proportions préréglées ou des coordonnées en pixels.' },
    es: { name: 'Recortar imagen', description: 'Recorta imágenes con selección por arrastre, proporciones preestablecidas o coordenadas en píxeles.' },
    de: { name: 'Bild zuschneiden', description: 'Schneide Bilder per Drag-Auswahl, Seitenverhältnis-Voreinstellungen oder exakter Pixel-Eingabe zu.' },
    pt: { name: 'Cortar imagem', description: 'Corte imagens arrastando para selecionar, com proporções predefinidas ou coordenadas em pixels.' },
  },
  rotate_flip_image: {
    en: { name: 'Rotate & Flip Image', description: 'Rotate by 90°, 180°, 270° or any custom angle and flip horizontally or vertically.' },
    fr: { name: 'Faire pivoter et retourner une image', description: 'Faites pivoter de 90°, 180°, 270° ou tout autre angle, et retournez horizontalement ou verticalement.' },
    es: { name: 'Rotar y voltear imagen', description: 'Rota 90°, 180°, 270° o cualquier ángulo personalizado y voltea en horizontal o vertical.' },
    de: { name: 'Bild drehen & spiegeln', description: 'Drehe um 90°, 180°, 270° oder einen eigenen Winkel und spiegle horizontal oder vertikal.' },
    pt: { name: 'Rotacionar e inverter imagem', description: 'Gire 90°, 180°, 270° ou qualquer ângulo personalizado e inverta horizontal ou verticalmente.' },
  },
  video_to_gif: {
    en: { name: 'Video to GIF Converter', description: 'Turn short videos (≤ 30s, ≤ 100 MB) into optimised animated GIFs entirely in your browser.' },
    fr: { name: 'Convertisseur Vidéo en GIF', description: 'Transformez des vidéos courtes (≤ 30s, ≤ 100 Mo) en GIF animés optimisés, entièrement dans votre navigateur.' },
    es: { name: 'Convertidor de Vídeo a GIF', description: 'Convierte vídeos cortos (≤ 30s, ≤ 100 MB) en GIF animados optimizados, totalmente en tu navegador.' },
    de: { name: 'Video zu GIF Konverter', description: 'Wandle kurze Videos (≤ 30s, ≤ 100 MB) in optimierte animierte GIFs um — komplett in deinem Browser.' },
    pt: { name: 'Conversor de Vídeo para GIF', description: 'Transforme vídeos curtos (≤ 30s, ≤ 100 MB) em GIFs animados otimizados, totalmente no seu navegador.' },
  },
  audio_cutter: {
    en: { name: 'Audio Cutter', description: 'Trim and cut MP3, WAV, M4A and other audio files with sub-second precision in your browser.' },
    fr: { name: 'Coupeur d\'audio', description: 'Coupez et découpez des fichiers MP3, WAV, M4A et autres avec une précision inférieure à la seconde, dans votre navigateur.' },
    es: { name: 'Cortador de audio', description: 'Recorta y corta archivos MP3, WAV, M4A y otros con precisión sub-segundo en tu navegador.' },
    de: { name: 'Audio-Schneider', description: 'Schneide MP3-, WAV-, M4A- und andere Audiodateien sekundengenau in deinem Browser zu.' },
    pt: { name: 'Cortador de áudio', description: 'Corte e edite arquivos MP3, WAV, M4A e outros com precisão de subsegundo no seu navegador.' },
  },
  volume_changer: {
    en: { name: 'Audio Volume Booster & Reducer', description: 'Boost quiet audio or reduce loud audio from -20 dB to +20 dB. 100 % browser-based.' },
    fr: { name: 'Amplificateur et réducteur de volume audio', description: 'Augmentez l\'audio trop faible ou réduisez l\'audio trop fort de -20 dB à +20 dB. 100 % dans le navigateur.' },
    es: { name: 'Amplificador y reductor de volumen de audio', description: 'Sube el audio bajo o reduce el audio alto de -20 dB a +20 dB. 100 % en el navegador.' },
    de: { name: 'Audio-Lautstärke verstärken & senken', description: 'Verstärke leise Audios oder reduziere laute Audios von -20 dB bis +20 dB. 100 % im Browser.' },
    pt: { name: 'Amplificador e redutor de volume de áudio', description: 'Aumente o áudio baixo ou reduza o áudio alto de -20 dB a +20 dB. 100 % no navegador.' },
  },
  audio_speed_changer: {
    en: { name: 'Audio Speed Changer', description: 'Speed audio up to 4× or slow down to 0.25× — useful for podcasts and language practice.' },
    fr: { name: 'Modificateur de vitesse audio', description: 'Accélérez jusqu\'à 4× ou ralentissez à 0,25× — pratique pour podcasts et apprentissage des langues.' },
    es: { name: 'Cambiador de velocidad de audio', description: 'Acelera hasta 4× o ralentiza hasta 0,25× — útil para pódcasts y práctica de idiomas.' },
    de: { name: 'Audio-Geschwindigkeit ändern', description: 'Beschleunige bis zu 4× oder verlangsame bis zu 0,25× — nützlich für Podcasts und Sprachenlernen.' },
    pt: { name: 'Alterador de velocidade de áudio', description: 'Acelere até 4× ou desacelere até 0,25× — útil para podcasts e prática de idiomas.' },
  },
  audio_to_wav: {
    en: { name: 'Audio to WAV Converter', description: 'Convert MP3, M4A, AAC, OGG, FLAC and more into uncompressed 16-bit PCM WAV files.' },
    fr: { name: 'Convertisseur Audio en WAV', description: 'Convertissez MP3, M4A, AAC, OGG, FLAC et plus en fichiers WAV PCM 16 bits non compressés.' },
    es: { name: 'Convertidor de Audio a WAV', description: 'Convierte MP3, M4A, AAC, OGG, FLAC y más a archivos WAV PCM 16 bits sin comprimir.' },
    de: { name: 'Audio zu WAV Konverter', description: 'Konvertiere MP3, M4A, AAC, OGG, FLAC und mehr in unkomprimierte 16-Bit-PCM-WAV-Dateien.' },
    pt: { name: 'Conversor de Áudio para WAV', description: 'Converta MP3, M4A, AAC, OGG, FLAC e mais para arquivos WAV PCM 16 bits sem compressão.' },
  },
  mp3_metadata_viewer: {
    en: { name: 'MP3 Metadata Viewer', description: 'View ID3v1 and ID3v2 tags inside MP3 files: title, artist, album, year, genre, embedded artwork.' },
    fr: { name: 'Visionneuse de métadonnées MP3', description: 'Consultez les étiquettes ID3v1 et ID3v2 d\'un MP3 : titre, artiste, album, année, genre, pochette intégrée.' },
    es: { name: 'Visor de metadatos MP3', description: 'Consulta etiquetas ID3v1 e ID3v2 de archivos MP3: título, artista, álbum, año, género, carátula incrustada.' },
    de: { name: 'MP3 Metadaten-Viewer', description: 'Zeige ID3v1- und ID3v2-Tags in MP3-Dateien: Titel, Künstler, Album, Jahr, Genre, eingebettetes Cover.' },
    pt: { name: 'Visualizador de metadados MP3', description: 'Veja tags ID3v1 e ID3v2 em arquivos MP3: título, artista, álbum, ano, gênero, capa embutida.' },
  },
};

// ── Full SEO content (English only — same pattern as existing tools) ───────

const EN_SEO = {
  png_to_jpg: {
    intro: 'PNG and JPG are the two most common image formats on the web — but they\'re built for different jobs. PNG keeps every pixel exactly as it was saved, including transparency, which makes file sizes large. JPG (also called JPEG) uses lossy compression that throws away tiny details your eye can\'t easily see, producing files that are 5–10× smaller. If you have a PNG screenshot, photo or graphic that doesn\'t need transparency, converting it to JPG is the fastest way to make it lighter for email, web pages, or storage. This converter runs entirely in your browser — your image never gets uploaded.',
    steps: [
      { title: 'Drop or pick your PNG', body: 'Drag a PNG into the upload box, or click to browse. Files of any size are supported as long as your browser can hold them in memory.' },
      { title: 'Choose your quality', body: 'Move the quality slider. 90% is a great default — visually lossless for most images. Drop to 75% for very small files.' },
      { title: 'Download the JPG', body: 'Click Download. The JPG saves to your device with the same base filename and a .jpg extension.' },
    ],
    faq: [
      { q: 'Will my PNG transparency be preserved?', a: 'No. JPG does not support transparency. Any transparent areas in your PNG will be filled with white. If you need transparency, use our JPG to PNG or PNG to WebP converter instead.' },
      { q: 'How small will the JPG be?', a: 'Typically 5–15× smaller than the source PNG, depending on the image content. Photos compress dramatically; flat-colour graphics less so.' },
      { q: 'Are my files uploaded to a server?', a: 'No. The conversion happens entirely in your browser using the Canvas API. We never see your image.' },
      { q: 'Is there a file size limit?', a: 'No hard limit. The only constraint is your browser\'s memory. Most modern browsers comfortably handle 50 MB+ images.' },
      { q: 'What quality should I pick?', a: 'For most uses, 85–90% is indistinguishable from the original to the human eye and produces tiny files. Go below 75% only when bytes matter more than visual fidelity.' },
    ],
  },
  jpg_to_png: {
    intro: 'Converting JPG to PNG is most useful when you need to add transparency, edit the image without re-introducing JPEG artifacts, or feed the image into a tool that requires PNG. Note that JPG is lossy — once compression has been applied, the data is gone. Converting to PNG won\'t magically restore detail, but it will stop *further* loss from happening on subsequent saves. Common use cases: preparing images for vector editing, removing backgrounds in another tool, or supplying assets to systems that mandate PNG.',
    steps: [
      { title: 'Upload your JPG', body: 'Drag a JPG/JPEG into the drop zone, or click to browse.' },
      { title: 'Convert', body: 'PNG is lossless, so there\'s no quality slider. Click Convert.' },
      { title: 'Download', body: 'A .png file with identical pixels (no further loss) is generated and ready to download.' },
    ],
    faq: [
      { q: 'Does the PNG add transparency to my JPG?', a: 'No. JPG cannot store transparency, so we cannot invent it. Convert to PNG first, then use a background-removal tool to add transparency.' },
      { q: 'Will the PNG be larger than the JPG?', a: 'Usually yes — often 3–5× larger. PNG is lossless and JPG is lossy, so this is unavoidable. Use PNG when quality matters more than size.' },
      { q: 'Is anything uploaded?', a: 'No. The conversion runs entirely in your browser. Your file never leaves your device.' },
    ],
  },
  png_to_webp: {
    intro: 'WebP is Google\'s modern image format that offers both lossless and lossy compression, with file sizes typically 25–35% smaller than equivalent PNG/JPG at the same quality. WebP supports transparency *and* animation, making it a near-universal replacement. All modern browsers — Chrome, Firefox, Safari (since 14), Edge — display WebP natively. Converting your PNG to WebP is one of the highest-leverage things you can do for site speed.',
    steps: [
      { title: 'Drop your PNG', body: 'Pick the PNG you want to convert.' },
      { title: 'Adjust quality', body: 'WebP at quality 80 looks identical to PNG for most images and is ~70% smaller. Crank up for art and screenshots.' },
      { title: 'Download', body: 'Save the .webp file. It\'s ready to ship to a CDN or attach to email.' },
    ],
    faq: [
      { q: 'Is WebP supported everywhere?', a: 'All major modern browsers support WebP. Older Safari (≤13), some legacy email clients and a few image viewers do not. For maximum compatibility, also keep a JPG fallback.' },
      { q: 'Does WebP keep transparency?', a: 'Yes. Unlike JPG, WebP preserves alpha channels, so transparent PNGs convert cleanly.' },
      { q: 'How much smaller will the WebP be?', a: 'Typically 25–35% smaller than the PNG. Photographic content compresses more than flat graphics.' },
    ],
  },
  webp_to_png: {
    intro: 'Some applications, image editors, and older systems still expect PNG. If you\'ve received a WebP file from a website or modern app and need to use it somewhere that doesn\'t accept WebP yet (think: certain CMS uploaders, legacy email clients, ancient print pipelines), converting to PNG is the safest choice — PNG is universally supported and lossless.',
    steps: [
      { title: 'Upload your WebP', body: 'Drag a .webp file into the drop zone, or click to pick one.' },
      { title: 'Convert', body: 'PNG is lossless — there\'s no quality slider. The convert button creates an identical-looking PNG.' },
      { title: 'Download', body: 'Save the .png file. Transparency, if present, is preserved.' },
    ],
    faq: [
      { q: 'Is transparency preserved?', a: 'Yes. PNG fully supports the alpha channel that WebP uses, so transparent areas stay transparent.' },
      { q: 'Why is the PNG bigger than the WebP?', a: 'PNG is lossless and uses an older compression scheme. Most converted PNGs end up 2–4× larger than the source WebP — that\'s expected.' },
      { q: 'Does this work with animated WebP?', a: 'No. Browser canvas APIs only render the first frame, so animations are flattened. Use a dedicated WebP-to-GIF tool for animations.' },
    ],
  },
  webp_to_jpg: {
    intro: 'JPG is still the broadest-compatibility raster format on the planet — every email client, every print shop, every cheap image viewer reads it. If you need to share a WebP image with someone whose tools don\'t recognise the format, converting to JPG is the reliable answer. Note that JPG is lossy and cannot represent transparency: any transparent areas in your WebP will be filled with white in the converted JPG.',
    steps: [
      { title: 'Drop your WebP', body: 'Drag the .webp file in, or click to browse.' },
      { title: 'Pick your quality', body: 'For email and casual sharing, 85% is a great balance. Drop to 70% for tiny attachments.' },
      { title: 'Download', body: 'A .jpg ready for any platform — email, social, CMS, print.' },
    ],
    faq: [
      { q: 'Will transparent areas be preserved?', a: 'No. JPG can\'t store transparency. Transparent pixels will be filled with white. If you need transparency, convert to PNG instead.' },
      { q: 'Can I convert animated WebPs to animated JPGs?', a: 'JPG isn\'t an animated format. Use our WebP to GIF or video-to-GIF tool if you need animation.' },
    ],
  },
  jpg_to_webp: {
    intro: 'Replacing JPG with WebP on a website typically cuts image bytes by 25–35% with no perceptible quality loss — that\'s a giant Lighthouse / Core Web Vitals win for very little effort. Use this tool whenever you have a JPG asset destined for the web (blog post images, e-commerce product shots, OG images) and the audience is on modern browsers.',
    steps: [
      { title: 'Drop your JPG', body: 'Drag a JPG into the upload box, or click to browse.' },
      { title: 'Pick a quality', body: 'WebP at quality 80 looks visually identical for most photos and is roughly 30% smaller than the source JPG.' },
      { title: 'Download the WebP', body: 'The new .webp file is ready for your CDN or product page.' },
    ],
    faq: [
      { q: 'Will the WebP look worse than the JPG?', a: 'At quality 80+, no. WebP often retains slightly more detail than JPG at the same file size, especially in flat colour areas.' },
      { q: 'How does it affect SEO and Core Web Vitals?', a: 'Switching to WebP usually improves the LCP (Largest Contentful Paint) metric and overall page weight, which Google uses as a ranking signal.' },
    ],
  },
  svg_to_png: {
    intro: 'SVG is great for scalable graphics, but a lot of contexts still expect raster images: social-media uploaders, certain CMSes, design boards, presentations, photo printers. This tool rasterises your SVG to a high-quality PNG using the browser\'s SVG renderer, so the result is pixel-perfect at the chosen size.',
    steps: [
      { title: 'Drop your SVG', body: 'Drag an .svg file into the upload area, or click to pick one.' },
      { title: 'Convert', body: 'The SVG is rendered onto a canvas at its intrinsic dimensions and saved as PNG.' },
      { title: 'Download', body: 'Save the .png. Transparency is preserved.' },
    ],
    faq: [
      { q: 'Why does my PNG look fuzzy?', a: 'Most likely your SVG didn\'t declare a width/height. We render at 1024×1024 by default in that case. Add explicit width="..." height="..." to your SVG, or use the resizer afterwards.' },
      { q: 'Are external assets (fonts, images) loaded?', a: 'External fonts loaded with @font-face from another origin may not render due to browser security. Embed fonts with data URIs or convert text to paths.' },
      { q: 'Is anything uploaded?', a: 'No. SVG is rendered entirely in your browser using the Canvas API.' },
    ],
  },
  svg_to_jpg: {
    intro: 'When you need a JPG version of an SVG — for an email signature, a thumbnail in a system that requires JPG, or sharing a graphic with someone whose tools don\'t support SVG — this tool rasterises the SVG and fills the background with white (since JPG can\'t carry transparency).',
    steps: [
      { title: 'Drop your SVG', body: 'Drag your .svg into the upload box.' },
      { title: 'Pick your quality', body: '90% is a great default for graphics with sharp edges; drop to 75% only for visual content where size matters.' },
      { title: 'Download', body: 'A .jpg with a white background is generated.' },
    ],
    faq: [
      { q: 'Why is the background white?', a: 'JPG cannot store transparency, so we fill transparent areas with white. If you need transparency, use SVG to PNG instead.' },
      { q: 'Can I get a different background colour?', a: 'Currently only white. For custom backgrounds, convert to PNG first then use an editor to set the background.' },
    ],
  },
  svg_to_webp: {
    intro: 'WebP is a modern raster format with broad browser support and much smaller files than PNG. Converting SVG to WebP gives you a compact raster suitable for OG images, blog headers, and shipped product assets, while keeping transparency intact.',
    steps: [
      { title: 'Upload your SVG', body: 'Drag the .svg in, or click to pick.' },
      { title: 'Pick your quality', body: 'Quality 80 is a strong default — small files, no visible loss for most graphics.' },
      { title: 'Download', body: 'Save the .webp. Transparency is preserved.' },
    ],
    faq: [
      { q: 'Will transparency be preserved?', a: 'Yes. WebP supports the same alpha channel as PNG, so transparent SVG areas remain transparent.' },
      { q: 'Why use WebP over PNG for SVG output?', a: 'WebP files are typically 25–40% smaller than PNG at the same visual quality, which makes a big difference for web performance.' },
    ],
  },
  image_resizer: {
    intro: 'Resizing images is one of the most-asked-for image operations on the web — for profile pictures with a strict pixel limit, blog images that need to fit a layout, social media thumbnails, or shrinking photos before email. Our resizer lets you specify exact pixel dimensions, percentage scaling, and choose any common output format. It runs entirely in your browser using the Canvas API, so your photos never leave your device.',
    steps: [
      { title: 'Upload your image', body: 'Drag any PNG, JPG, WebP or GIF into the drop zone, or click to browse.' },
      { title: 'Set your dimensions', body: 'Type a target width or height, or use percent. Keep "Aspect ratio" on to scale proportionally.' },
      { title: 'Pick output format and quality', body: 'WebP for the smallest size, PNG for transparency, JPG for max compatibility.' },
      { title: 'Download', body: 'Click Download to save the resized image.' },
    ],
    faq: [
      { q: 'Will my image get blurry?', a: 'Scaling down (e.g. 4000 × 3000 → 800 × 600) is essentially lossless. Scaling up adds blur — there\'s no detail to invent. Always start from the largest source you have.' },
      { q: 'How do I resize for a specific use case (e.g. Twitter, Instagram)?', a: 'Common targets: Instagram square 1080 × 1080, Twitter post 1200 × 675, Open Graph 1200 × 630, favicon 192 × 192.' },
      { q: 'Is anything uploaded?', a: 'No. Everything runs in your browser; we never see your file.' },
    ],
  },
  crop_image: {
    intro: 'Cropping is a precision operation — pixels matter. Our cropper lets you drag a selection rectangle directly on the image, snap to common ratios (square, 4:3, 16:9, 9:16) for social media presets, or type exact x/y/width/height coordinates when you need pixel-perfect output. The full-resolution source is preserved at all times — the on-screen preview is just scaled to fit your viewport.',
    steps: [
      { title: 'Upload your image', body: 'Drop a PNG, JPG, WebP or GIF.' },
      { title: 'Set your crop area', body: 'Drag a new selection on the image, or grab the corner handles to resize.' },
      { title: 'Pick a ratio (optional)', body: 'Click 1:1 for square, 16:9 for landscape, 9:16 for vertical stories — the selection auto-locks.' },
      { title: 'Apply and download', body: 'Click Apply Crop, then Download.' },
    ],
    faq: [
      { q: 'Are pixels lost when cropping?', a: 'Only the pixels outside the crop rectangle are discarded. The kept area retains its full resolution.' },
      { q: 'Can I crop multiple images at once?', a: 'Currently this tool processes one image at a time. We may add a batch mode in the future — let us know if you need it.' },
      { q: 'Does it work on touch screens?', a: 'Yes. The selection box uses pointer events, so touch and mouse work the same way.' },
    ],
  },
  rotate_flip_image: {
    intro: 'Sometimes a photo comes out sideways from your phone, a screenshot needs flipping for a tutorial, or a graphic needs mirroring for a layout. This tool rotates by 90° increments or any custom angle (with the canvas auto-resized so nothing is clipped) and flips horizontally or vertically. Everything happens in your browser.',
    steps: [
      { title: 'Drop an image', body: 'Drag any PNG, JPG, WebP or GIF.' },
      { title: 'Use the action buttons', body: 'Rotate 90° / -90° / 180°, flip horizontal, flip vertical. Or type a custom angle.' },
      { title: 'Pick a format', body: 'Output as PNG (preserves transparency), JPG, or WebP.' },
      { title: 'Download', body: 'Click Download to save the result.' },
    ],
    faq: [
      { q: 'Why does the canvas grow when I rotate?', a: 'Diagonal rotations need a larger bounding box to avoid clipping the corners. We auto-resize the canvas so the entire rotated image fits.' },
      { q: 'Will it correct EXIF orientation automatically?', a: 'Modern browsers honour EXIF orientation when decoding, so the tool sees the visually-correct image. Manual rotation lets you go further.' },
    ],
  },
  video_to_gif: {
    intro: 'Animated GIFs are still everywhere — slack, GitHub, Twitter, blog posts. Converting a short video clip to a GIF used to mean uploading to a sketchy site. This tool runs the entire conversion in your browser: we extract frames using the browser\'s video decoder and encode them with the GIF encoder library lazy-loaded only when you click Convert. Your file never leaves your device.',
    steps: [
      { title: 'Upload a video', body: 'Drop an MP4, MOV, WebM or other browser-supported video. Max 100 MB and 30 seconds.' },
      { title: 'Trim and tune', body: 'Set start/end seconds, pick FPS (12 is a great default), and choose an output width (480 px is a balanced choice).' },
      { title: 'Convert', body: 'Click Convert to GIF. The encoder loads (~30 KB) and processing happens locally with a progress bar.' },
      { title: 'Download', body: 'Save the .gif file. Smaller clips and lower FPS give smaller files.' },
    ],
    faq: [
      { q: 'Why is there a 30-second limit?', a: 'GIF is an inefficient format. A 30-second 480p clip at 12 FPS is already 5–10 MB. Anything longer becomes impractical.' },
      { q: 'Is my video uploaded?', a: 'No. Everything happens in your browser — frame extraction and GIF encoding both run locally.' },
      { q: 'How can I make smaller GIFs?', a: 'Reduce FPS (12 → 8), shrink the width (480 → 320), and trim aggressively. Each cuts size roughly proportionally.' },
      { q: 'Why does conversion feel slow on my phone?', a: 'GIF encoding is CPU-intensive. Trimming the clip to a few seconds and dropping FPS dramatically speeds things up.' },
    ],
  },
  audio_cutter: {
    intro: 'Audio cutting is one of the most common tasks anyone working with sound runs into — trimming silence at the start of a podcast, isolating a quote from a long recording, removing the awkward few seconds at the end of a voicemail. Our audio cutter uses the Web Audio API to decode any browser-supported format (MP3, WAV, M4A, AAC, OGG, FLAC) and writes a precise, lossless WAV cut entirely in your browser.',
    steps: [
      { title: 'Drop an audio file', body: 'Drag any MP3 / WAV / M4A / AAC / OGG / FLAC into the upload area.' },
      { title: 'Pick start and end times', body: 'Use the range sliders or type exact seconds — sub-second precision.' },
      { title: 'Cut and preview', body: 'Click Cut & preview to hear the result before downloading.' },
      { title: 'Download', body: 'Save the cut as a 16-bit PCM WAV file.' },
    ],
    faq: [
      { q: 'Why is the output a WAV file even if I uploaded an MP3?', a: 'MP3 encoding in the browser without a heavy library (LAME) isn\'t practical. WAV is universally supported and lossless. You can re-encode to MP3 with our future MP3 encoder, or use a desktop tool.' },
      { q: 'Does it preserve audio quality?', a: 'Yes. Decoding to PCM and re-encoding as WAV is lossless — you only lose information when you re-encode to a lossy format like MP3 / AAC.' },
      { q: 'What\'s the maximum file size?', a: 'Limited only by your browser\'s memory. Most modern browsers handle 200 MB+ comfortably.' },
    ],
  },
  volume_changer: {
    intro: 'Voice notes that sound great on your phone but tinny on someone else\'s laptop, podcasts that vary in level between guests, lectures recorded too quietly — all common problems. The volume changer applies a constant gain (in decibels) to every sample of your audio file, in your browser. ±20 dB is the practical limit before clipping becomes audible.',
    steps: [
      { title: 'Upload audio', body: 'Drop an MP3, WAV, M4A or other audio file.' },
      { title: 'Set the gain', body: '+6 dB is "noticeably louder", +10 dB is "much louder". -6 dB roughly halves the volume. Try small steps first.' },
      { title: 'Apply and preview', body: 'Listen to the result before downloading.' },
      { title: 'Download', body: 'Save the boosted/reduced version as a WAV.' },
    ],
    faq: [
      { q: 'Will boosting too much distort my audio?', a: 'Yes. Going beyond about +12 dB on already-loud audio causes clipping (hard distortion). Start small.' },
      { q: 'Can I normalise to a specific peak level?', a: 'This tool applies a constant gain. For peak/LUFS normalisation, use a desktop DAW.' },
    ],
  },
  audio_speed_changer: {
    intro: 'Speeding up podcasts to fit them in a commute, slowing down a song to learn a riff on guitar, or making a lecture digestible — speed changing is one of the most useful audio tools for everyday use. This tool uses linear interpolation to resample your audio. As is standard for "speed change without preserving pitch", faster playback raises the pitch and slower playback lowers it, which is what most users actually want.',
    steps: [
      { title: 'Upload audio', body: 'Drop any browser-supported audio file.' },
      { title: 'Pick a speed', body: 'Use the slider or one of the presets. 1.5× and 2× are great for podcasts; 0.5× for music transcription.' },
      { title: 'Apply and preview', body: 'Hear the result before saving.' },
      { title: 'Download', body: 'Save the time-stretched WAV file.' },
    ],
    faq: [
      { q: 'Why does the pitch change?', a: 'Resampling without time-stretching changes pitch with speed. Pitch-preserving time-stretch (PSOLA, phase vocoder) needs a much heavier algorithm and is on our roadmap.' },
      { q: 'Is there a quality loss?', a: 'Linear interpolation introduces a tiny amount of high-frequency softening. For voice content it\'s inaudible; for high-quality music, use a DAW.' },
    ],
  },
  audio_to_wav: {
    intro: 'WAV is the universal "raw PCM" container — every operating system, every audio editor, every embedded device understands it. Converting MP3, M4A, AAC, OGG or FLAC to WAV is useful when you need to feed audio into a tool that doesn\'t accept compressed formats, or when you want a lossless working copy before further editing. The browser\'s Web Audio API decodes the source and we write a 16-bit stereo (or mono) WAV file using the same parameters as the input.',
    steps: [
      { title: 'Upload audio', body: 'Drop any browser-decodable audio file.' },
      { title: 'Convert', body: 'Click Convert to WAV. Decoding + re-encoding usually takes <2 seconds for a 5-minute file.' },
      { title: 'Download', body: 'Save the .wav.' },
    ],
    faq: [
      { q: 'Will the WAV be much larger than my MP3?', a: 'Typically 5–10× larger. WAV is uncompressed — that\'s the trade-off for universal compatibility and zero generational loss.' },
      { q: 'Does it support every audio format?', a: 'It supports every format your browser can decode via the Web Audio API: MP3, WAV, M4A, AAC, OGG (Vorbis), FLAC. Browser support varies slightly — Safari may struggle with Ogg Vorbis on older versions.' },
    ],
  },
  mp3_metadata_viewer: {
    intro: 'Every MP3 file has metadata baked into it — the title, artist, album, year, genre, comment, and often an embedded album cover. This is the data your music player uses to show "Now playing" cards. Sometimes you want to see what\'s in there: when troubleshooting a misnamed track, when an MP3 export from a recorder shows weird tags, or just out of curiosity. This viewer reads ID3v1 (legacy 128-byte footer) and ID3v2 (modern, prepended) tags, including embedded artwork, all in your browser.',
    steps: [
      { title: 'Drop an MP3', body: 'Drag an .mp3 file into the upload area.' },
      { title: 'Read the tags', body: 'Title, artist, album, year, genre, comment and embedded artwork all appear instantly.' },
      { title: 'Reset to view another file', body: 'Click Reset to load a different MP3.' },
    ],
    faq: [
      { q: 'Can I edit the tags here?', a: 'Not yet — this tool is read-only. We\'re considering adding a tag editor — let us know via the contact form if you\'d use one.' },
      { q: 'What if my MP3 has no tags?', a: 'You\'ll see "No tags found". Many transcoders strip tags by default — re-tag with a desktop tool like Mp3tag.' },
      { q: 'Is the file uploaded?', a: 'No. The file is read locally in your browser. Nothing is sent over the network.' },
    ],
  },
};

// ── Run ────────────────────────────────────────────────────────────────────

const LANGS = ['en', 'fr', 'es', 'de', 'pt'];

function deepMergeMissing(target, source) {
  for (const k of Object.keys(source)) {
    if (target[k] === undefined) {
      target[k] = source[k];
    } else if (typeof target[k] === 'object' && !Array.isArray(target[k])
            && typeof source[k] === 'object' && !Array.isArray(source[k])) {
      deepMergeMissing(target[k], source[k]);
    }
  }
}

let updatedAny = false;
for (const lang of LANGS) {
  const file = path.join(ROOT, 'locales', `${lang}.json`);
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));

  // 1. New common keys
  data.common = data.common || {};
  deepMergeMissing(data.common, NEW_COMMON[lang]);

  // 2. New categories
  data.categories = data.categories || {};
  deepMergeMissing(data.categories, NEW_CATEGORIES[lang]);

  // 3. Tools
  data.tools = data.tools || {};
  for (const [key, perLang] of Object.entries(TOOLS_I18N)) {
    if (!data.tools[key]) data.tools[key] = {};
    const t = data.tools[key];
    if (perLang[lang]) {
      if (!t.name)        t.name        = perLang[lang].name;
      if (!t.description) t.description = perLang[lang].description;
    }
    if (lang === 'en' && EN_SEO[key]) {
      if (!t.seo) t.seo = {};
      if (!t.seo.intro) t.seo.intro = EN_SEO[key].intro;
      if (!t.seo.steps) t.seo.steps = EN_SEO[key].steps;
      if (!t.seo.faq)   t.seo.faq   = EN_SEO[key].faq;
    }
  }

  fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n', 'utf8');
  updatedAny = true;
  console.log(`Updated ${file}`);
}
if (!updatedAny) console.log('Nothing to update.');
