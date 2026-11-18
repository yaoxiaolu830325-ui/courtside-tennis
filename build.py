from pathlib import Path
root=Path(__file__).parent
html=(root/'template.html').read_text()
html=html.replace('/* CORE */',(root/'core.js').read_text().replace('</script>','<\\/script>'))
html=html.replace('/* GAME */',(root/'game.js').read_text().replace('</script>','<\\/script>'))
(root/'index.html').write_text(html)
print('built',root/'index.html',len(html),'bytes')
