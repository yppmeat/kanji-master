let jyukugo, selectedMondai, currentIndex = -1, elements;
let allCount = 50, wrongCount = 0;

async function main(minGrade, maxGrade, limit) {
  const _jyukugo = await loadCSV();
  jyukugo = _jyukugo;
  selectMondai(minGrade, maxGrade, limit);
  setIdElements();
  setEventListeners();
  Object.values(elements).forEach(v => v.disabled = false);

  nextMondai();
}

main(5, 2.5, allCount);

async function loadCSV() {
  const res = await fetch('./data/jyukugo.csv');
  const text = await res.text();
  const csv = text.split(/\r?\n/).slice(1).map(v => v.split('\t'));
  csv.forEach(v => {
    v[0] = (v[0] == 'pre2' ? 2.5 : +v[0]);
    v[2] = v[2].slice(1, -1).split(',').map(v => katakanaToHiragana(v));
  });
  return csv;
}

function selectMondai(minGrade, maxGrade, limit) {
  const filteredJyukugo = jyukugo.filter(v => v[0] <= minGrade && v[0] >= maxGrade);
  const n = filteredJyukugo.length;
  const shuffled = [...filteredJyukugo];
  selectedMondai = [];

  for (let i = 0; i < limit; i++) {
    const j = Math.floor(Math.random() * (n - i)) + i;
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    selectedMondai.push(shuffled[i]);
  }
}

function nextMondai() {
  currentIndex++;
  if(currentIndex >= selectedMondai.length) {
    Object.values(elements).forEach(v => v.disabled = true);
    if(wrongCount > 0) {
      alert(`全${allCount}問中${allCount - wrongCount}問正解！次は頑張ろう！`);
    } else {
      alert(`全${allCount}問中${allCount - wrongCount}問正解！全問正解です！`);
    }
    return;
  }
  elements.mondai_text.innerText = selectedMondai[currentIndex][1];
  elements.mondai_rt.innerText = '';
  elements.prev_kaitou.innerText = '';
  elements.kaitou.focus();
}

function setIdElements() {
  elements = [...document.querySelectorAll('[id]')].reduce((acc, input) => {
    acc[input.id.replaceAll('-', '_')] = input;
    return acc;
  }, {});
}

function getFocusableElement(isLast) {
  const focusableElements = [...document.querySelectorAll('input')];
  if(isLast) {
    return focusableElements.at(-1);
  }
  return focusableElements[0];
}

const firstFocusableElement = getFocusableElement(false);
const lastFocusableElement = getFocusableElement(true);

document.addEventListener('keydown', e => {
  if(e.key != 'Tab') return;
  if(e.shiftKey && document.activeElement === firstFocusableElement) {
    e.preventDefault();
    lastFocusableElement.focus();
    return;
  }
  if(!e.shiftKey && document.activeElement === lastFocusableElement) {
    e.preventDefault();
    firstFocusableElement.focus();
    return;
  }
});

function setEventListeners() {
  elements.kaitou.addEventListener('keydown', e => {
    if(e.key == 'Enter') {
      checkAnswer();
    }
    if(e.key == 'Escape') {
      clearAnswer();
    }
  });
  elements.check.addEventListener('click', checkAnswer);
  elements.clear.addEventListener('click', clearAnswer);
  elements.skip.addEventListener('click', skipAnswer);
  document.body.addEventListener('animationend', e => {
    if(e.animationName == 'wrong-body') {
      document.body.classList.remove('wrong');
    }
  });
  elements.mondai.addEventListener('transitionend', e => {
    if(e.propertyName == 'color') {
      elements.mondai.classList.remove('correct');
    }
  });
}

function setMondai() {

}

async function checkAnswer() {
  const answer = katakanaToHiragana(elements.kaitou.value.trim());
  if(!answer) return;
  const correct = selectedMondai[currentIndex][2];
  elements.kaitou.value = '';
  if(correct.includes(answer)) {
    elements.prev_kaitou.innerText = '';
    elements.mondai.classList.add('correct');
    showCorrectAnswer(answer);
  } else {
    const { value, result } = getNearestString(answer, selectedMondai[currentIndex][2]);
    elements.mondai_rt.innerHTML = result;
    if(value && (convertDakuten(value) == convertDakuten(answer) || value == result)) {
      elements.prev_kaitou.innerText = '惜しい！\n' + answer;
    } else {
      elements.prev_kaitou.innerText = answer;
    }
    document.body.classList.add('wrong');
  }
}

function clearAnswer() {
  elements.kaitou.value = '';
}

async function skipAnswer() {
  showCorrectAnswer(selectedMondai[currentIndex][2][0]);
}

async function showCorrectAnswer(correct) {
  Object.values(elements).forEach(v => v.disabled = true);
  elements.mondai_rt.innerText = correct;
  await sleep(2000);
  Object.values(elements).forEach(v => v.disabled = false);
  nextMondai();
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function katakanaToHiragana(str) {
  return str.replace(/[\u30A1-\u30F6]/g, (match) => {
    return String.fromCharCode(match.charCodeAt() - 0x60);
  });
}

function convertDakuten(str) {
  const dakuten = {
    'が': 'か',
    'ぎ': 'き',
    'ぐ': 'く',
    'げ': 'け',
    'ご': 'こ',
    'ざ': 'さ',
    'じ': 'し',
    'ず': 'す',
    'ぜ': 'せ',
    'ぞ': 'そ',
    'だ': 'た',
    'ぢ': 'ち',
    'づ': 'つ',
    'で': 'て',
    'ど': 'と',
    'ば': 'は',
    'び': 'ひ',
    'ぶ': 'ふ',
    'べ': 'へ',
    'ぼ': 'ほ',
    'ぱ': 'は',
    'ぴ': 'ひ',
    'ぷ': 'ふ',
    'ぺ': 'へ',
    'ぽ': 'ほ',
    'ぁ': 'あ',
    'ぃ': 'い',
    'ぅ': 'う',
    'ぇ': 'え',
    'ぉ': 'お',
    'っ': 'つ',
  }
  return str.replace(/[\u3041-\u3096]/g, (match) => {
    return dakuten[match] ?? match;
  });
}

function getNearestString(answer, correct) {
  correct = correct.map(v => {
    let first = '', last = '';
    for(let i = 1; i <= Math.min(v.length, answer.length); i++) {
      if(v.slice(0, i) == answer.slice(0, i)) {
        first = v.slice(0, i);
      }
      if(v.slice(-i) == answer.slice(-i)) {
        last = v.slice(-i);
      }
    }
    return { value: v, first, last };
  });
  let max = 0, index = -1;
  correct.forEach((v, i) => {
    if(v.first.length > max) {
      max = v.first.length;
      index = i;
    }
    if(v.last.length > max) {
      max = v.last.length;
      index = i;
    }
  });
  if(index == -1) return { result: '' };
  correct = correct[index];
  const result = correct.first.padEnd(correct.value.length - correct.last.length, '　') + correct.last;
  return { value: correct.value, result: result.replaceAll('　', '&emsp;') };
}
