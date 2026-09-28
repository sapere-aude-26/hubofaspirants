
/* HUB OF ASPIRANTS V5.3 — Results & Performance Enhancement
   Additive UI/data helpers. Existing V5.2 result generation remains authoritative. */
(function(){
  "use strict";

  function num(v){
    var n = Number(v);
    return Number.isFinite(n) ? n : 0;
  }

  function pct(v){
    return Math.round(num(v) * 100) / 100;
  }

  function normalizeResult(r){
    if(!r || typeof r !== "object") return null;
    return {
      score: num(r.score ?? r.total_score ?? r.marks ?? r.obtained_marks),
      percentage: pct(r.percentage ?? r.percent ?? r.score_percentage),
      correct: num(r.correct ?? r.correct_count),
      wrong: num(r.wrong ?? r.wrong_count),
      skipped: num(r.skipped ?? r.unanswered ?? r.skip_count),
      timeTaken: r.time_taken ?? r.timeTaken ?? r.duration ?? "",
      testName: r.test_name ?? r.testName ?? r.title ?? "Test",
      attemptedAt: r.attempted_at ?? r.attemptedAt ?? r.created_at ?? null
    };
  }

  window.HOA_performance = {
    normalize: normalizeResult,

    summarize: function(results){
      var rows = (Array.isArray(results) ? results : [])
        .map(normalizeResult).filter(Boolean);

      if(!rows.length) return {
        tests: 0, averageScore: 0, bestScore: 0,
        averagePercentage: 0, totalCorrect: 0,
        totalWrong: 0, totalSkipped: 0
      };

      var scores = rows.map(function(x){return x.score;});
      var percentages = rows.map(function(x){return x.percentage;});

      return {
        tests: rows.length,
        averageScore: pct(scores.reduce((a,b)=>a+b,0) / rows.length),
        bestScore: Math.max.apply(null, scores),
        averagePercentage: pct(percentages.reduce((a,b)=>a+b,0) / rows.length),
        totalCorrect: rows.reduce((a,b)=>a+b.correct,0),
        totalWrong: rows.reduce((a,b)=>a+b.wrong,0),
        totalSkipped: rows.reduce((a,b)=>a+b.skipped,0)
      };
    }
  };

  /* Creates a compact performance panel only when explicitly requested.
     Existing pages are not rearranged automatically. */
  window.HOA_renderPerformance = function(container, results){
    if(!container) return;

    var s = window.HOA_performance.summarize(results);
    container.innerHTML =
      '<div class="hoa-performance-panel">' +
        '<div class="hoa-performance-title">My Performance</div>' +
        '<div class="hoa-performance-grid">' +
          '<div><strong>'+s.tests+'</strong><span>Tests</span></div>' +
          '<div><strong>'+s.averagePercentage+'%</strong><span>Average</span></div>' +
          '<div><strong>'+s.bestScore+'</strong><span>Best Score</span></div>' +
          '<div><strong>'+s.totalCorrect+'</strong><span>Correct</span></div>' +
          '<div><strong>'+s.totalWrong+'</strong><span>Wrong</span></div>' +
          '<div><strong>'+s.totalSkipped+'</strong><span>Skipped</span></div>' +
        '</div>' +
      '</div>';
  };
})();
