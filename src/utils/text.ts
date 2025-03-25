import * as d3 from 'd3';

export function wrapText(texts: d3.SelectionOrTransition<SVGTextElement, any, any, any>) {
  texts.each(function () {
    const text = d3.select(this);
    const words = text.text().split(/\s+/).reverse();
    const width = parseFloat(text.attr('width'));
    const height = parseFloat(text.attr('height'));
    const textAnchor = text.attr('text-anchor') || text.style('text-anchor');
    const alignmentBaseline = text.attr('alignment-baseline') || text.style('alignment-baseline');
    const x = text.attr('x') ? parseFloat(text.attr('x')) : 0;

    let tspan = text
      .text(null)
      .append('tspan');
    let lineNumber = 0;
    let line: string[] = [];
    let word = words.pop();
    while (word) {
      line.push(word);
      tspan
        .text(line.join(' '))
        .attr('text-anchor', textAnchor)
        .attr('alignment-baseline', alignmentBaseline);
      const { width: tspanWidth = 0, height: tspnHeight = 0 } = tspan.node()?.getBBox() || {};
      if (tspanWidth > width) {
        line.pop();
        if (line.length === 0) {
          return;
        }
        const textHeight = text.node()?.getBBox().height || 0;
        if (height && textHeight * 2 > height) {
          tspan.text(`${line.join(' ')}...`);
          return;
        }
        lineNumber += 1;
        text
          .selectAll('tspan')
          // eslint-disable-next-line @typescript-eslint/no-loop-func
          .attr('dy', (_, i) => (
            i === 0
              ? alignmentBaseline === 'central' ? -(lineNumber * tspnHeight) / 2 : 0
              : tspnHeight
          ));
        tspan.text(line.join(' '));
        line = [word];
        tspan = text
          .append('tspan')
          .text(word)
          .attr('x', x)
          .attr('dy', tspnHeight)
          .attr('text-anchor', textAnchor)
          .attr('alignment-baseline', alignmentBaseline);
      }
      word = words.pop();
    }
  });
}

export function truncateText(texts: d3.SelectionOrTransition<SVGTextElement, any, any, any>) {
  texts.each(function () {
    const text = d3.select(this);
    const letters = text.text().split('');
    const width = parseFloat(text.attr('width'));
    if (!width) return;

    let truncated = false;
    while (letters.length > 1) {
      if ((text.node()?.getComputedTextLength() || 0) <= width) {
        return;
      }
      letters.pop();
      if (!truncated) {
        truncated = true;
      }
      text
        .text(`${letters.join('')}...`);
    }
  });
}
