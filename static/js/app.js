document.addEventListener('DOMContentLoaded', function () {

  // ── Accordion theory ────────────────────────────────────────────────────────
  document.querySelectorAll('.theory-section-header').forEach(function (header) {
    header.addEventListener('click', function () {
      var body = this.nextElementSibling;
      var chevron = this.querySelector('.chevron');
      var isOpen = body.classList.contains('open');
      document.querySelectorAll('.theory-section-body.open').forEach(function (b) { b.classList.remove('open'); });
      document.querySelectorAll('.chevron.open').forEach(function (c) { c.classList.remove('open'); });
      if (!isOpen) { body.classList.add('open'); if (chevron) chevron.classList.add('open'); }
    });
  });

  // ── Quiz & Adaptive shared logic ────────────────────────────────────────────
  var quizForm = document.getElementById('quiz-form');
  if (quizForm) {
    var answers = {};
    var answered = 0;
    var totalQ = parseInt(quizForm.dataset.total || '0');
    var subject = quizForm.dataset.subject;
    var part = quizForm.dataset.part;
    var mode = quizForm.dataset.mode || 'quiz';
    var submitted = false;
    var startTimes = {};
    var times = {};

    document.querySelectorAll('.option').forEach(function (opt) {
      opt.addEventListener('click', function () {
        if (submitted) return;
        var qid = this.dataset.qid;
        var idx = this.dataset.idx;
        if (answers[qid] !== undefined) return;
        if (!startTimes[qid]) startTimes[qid] = Date.now();
        answers[qid] = idx;
        times[qid] = Math.round((Date.now() - startTimes[qid]) / 1000);
        answered++;
        var qBlock = this.closest('.quiz-question');
        qBlock.querySelectorAll('.option').forEach(function (o) { o.classList.add('disabled'); });
        this.classList.add('selected');
        var counter = document.getElementById('answered-count');
        if (counter) counter.textContent = answered;
      });
    });

    var submitBtn = document.getElementById('submit-quiz');
    if (submitBtn) {
      submitBtn.addEventListener('click', function () {
        if (submitted) return;
        if (answered === 0) { alert('Ответьте хотя бы на один вопрос'); return; }
        submitted = true;
        this.disabled = true;
        this.textContent = 'Проверяем...';

        var base = window.location.pathname.replace(/\/adaptive$|\/quiz.*/, '');
        fetch(base + '/quiz/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ answers: answers, part: part, mode: mode, times: times })
        })
        .then(function (r) { return r.json(); })
        .then(function (data) {
          if (data.error) { alert('Ошибка: ' + data.error); submitted = false; submitBtn.disabled = false; return; }

          var hadMistakes = false;
          data.results.forEach(function (r) {
            var qBlock = document.querySelector('[data-qid-block="' + r.id + '"]');
            if (!qBlock) return;
            var opts = qBlock.querySelectorAll('.option');
            opts.forEach(function (opt) {
              var idx = parseInt(opt.dataset.idx);
              if (idx === r.correct_index) opt.classList.add('correct-answer');
              else if (opt.classList.contains('selected') && !r.correct) opt.classList.add('wrong-answer');
            });
            if (answers[r.id] !== undefined) qBlock.classList.add(r.correct ? 'correct' : 'wrong');
            if (!r.correct) hadMistakes = true;

            var expEl = qBlock.querySelector('.explanation');
            if (expEl) {
              var wrongExpl = {};
              try { wrongExpl = JSON.parse(expEl.dataset.wrongExpl || '{}'); } catch(e) {}
              var ai = answers[r.id];
              var parts = [];
              if (r.explanation) parts.push('💡 ' + r.explanation);
              if (!r.correct && ai !== undefined && wrongExpl[String(ai)]) {
                parts.push('<span style="color:#dc2626;display:block;margin-top:4px">Ваш ответ: ' + wrongExpl[String(ai)] + '</span>');
              }
              if (!r.correct && r.correct_option_text) {
                parts.push('<span style="color:#16a34a;display:block;margin-top:4px">Правильно: ' + r.correct_option_text + '</span>');
              }
              if (parts.length) { expEl.innerHTML = parts.join(''); expEl.style.display = 'block'; }
            }
          });

          var resultDiv = document.getElementById('quiz-result');
          if (resultDiv) {
            var scoreEl = resultDiv.querySelector('.result-score');
            scoreEl.textContent = data.score + '%';
            scoreEl.className = 'result-score ' + (data.score >= 80 ? 'great' : data.score >= 50 ? 'ok' : 'poor');
            resultDiv.querySelector('.result-correct').textContent = data.correct + ' из ' + data.total;
            resultDiv.querySelector('.result-xp').textContent = '+' + data.xp_gain + ' XP';
            var notice = resultDiv.querySelector('.result-mistakes-notice');
            if (notice && hadMistakes) notice.style.display = 'block';
            resultDiv.style.display = 'block';
            resultDiv.scrollIntoView({ behavior: 'smooth' });
          }
          submitBtn.style.display = 'none';
        })
        .catch(function () { alert('Ошибка соединения'); submitted = false; submitBtn.disabled = false; });
      });
    }

    // Track question view times for time analytics
    document.querySelectorAll('.quiz-question').forEach(function(block) {
      var qid = block.dataset.qidBlock;
      if (qid && !startTimes[qid]) {
        var obs = new IntersectionObserver(function(entries) {
          entries.forEach(function(e) {
            if (e.isIntersecting && !startTimes[qid]) startTimes[qid] = Date.now();
          });
        });
        obs.observe(block);
      }
    });
  }

  // ── Tab switching (generic) ─────────────────────────────────────────────────
  document.querySelectorAll('[data-tab]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var target = this.dataset.tab;
      document.querySelectorAll('[data-tab]').forEach(function (b) { b.classList.remove('active'); });
      this.classList.add('active');
      document.querySelectorAll('[data-tab-content]').forEach(function (c) {
        c.style.display = c.dataset.tabContent === target ? '' : 'none';
      });
    });
  });

  var tabSwitchBtns = document.querySelectorAll('.tab-switch-btn');
  tabSwitchBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var target = this.dataset.target;
      tabSwitchBtns.forEach(function (b) { b.classList.remove('active'); });
      this.classList.add('active');
      document.querySelectorAll('.tab-panel').forEach(function (p) {
        p.style.display = p.id === target ? '' : 'none';
      });
    });
  });

  var firstPanel = document.querySelector('.tab-panel');
  if (firstPanel) {
    document.querySelectorAll('.tab-panel').forEach(function (p, i) {
      if (i > 0) p.style.display = 'none';
    });
  }
});
