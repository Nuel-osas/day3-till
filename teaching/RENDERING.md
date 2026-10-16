# Deck regeneration and checks

`pnpm slides` rebuilds `Day3_Real_Time_Sui.pptx` and the speaker notes. It uses DM Sans and JetBrains Mono, supplied with their licences under `public/fonts/`. The teaching edition uses editable diagrams, tables and source-code excerpts; the app screenshots remain available under `teaching/assets/`.

The checked-in PDF was rendered on macOS with Quick Look and Chrome. This preserves vector text while converting any Quick Look PDF shape assets to browser-readable PNGs. All 15 slides were checked as rendered images; the final overflow check found no overflowing text containers. Diagram arrows use text glyphs to avoid Quick Look repeating zero-height line shapes on later slides.

To repeat the macOS workflow:

```sh
pnpm slides
mkdir -p /tmp/till-render
qlmanage -p -o /tmp/till-render teaching/Day3_Real_Time_Sui.pptx
python3 -m venv /tmp/till-render/venv
/tmp/till-render/venv/bin/pip install PyMuPDF
/tmp/till-render/venv/bin/python teaching/render-quicklook.py /tmp/till-render/Day3_Real_Time_Sui.pptx.qlpreview
```

Open the generated `Rendered.html` in Chrome with local-file access enabled, wait for `document.fonts.ready`, and print at a 960 × 540 px page size with zero margins and backgrounds enabled. A browser automation runner can screenshot each `div.slide` and export the PDF with these same settings. Check that the PDF has exactly 15 pages and inspect code slides and screenshots at presentation size.

PowerPoint's own PDF export is an alternative. Install the supplied fonts first and inspect the result, since presentation engines can wrap text differently. The PowerPoint contains editable text, shapes and presenter notes; screenshots remain raster images.

The generator also updates the older `Day3_Till_Live_Data_Seedless_Style.pptx` compatibility filename. After rendering the PDF, copy the same result to both `Day3_Real_Time_Sui.pdf` and `Day3_Till_Live_Data_Seedless_Style.pdf`. Refresh classroom copies together so old links do not point to different lessons.
