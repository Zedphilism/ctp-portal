$html = Get-Content "assets/animation/iframe-engine.html" -Raw
$engine = Get-Content "assets/animation/engine.jsx" -Raw
$newHtml = $html.Replace('<script type="text/babel" src="engine.jsx"></script>', "<script type=`"text/babel`">`n$engine`n</script>")
Set-Content "assets/animation/iframe-engine.html" $newHtml
