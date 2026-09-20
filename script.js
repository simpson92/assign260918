// ===== 친구수첩 =====

function $(selector) { return document.querySelector(selector); }   //  $ -> document.querySelector(selector) 로 정의

// 글자를 안전하게 바꿔 주는 함수 (특수문자 때문에 화면이 깨지지 않게)
function esc(text) {
  if (text === null || text === undefined) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const KEY = 'chingu-sucheop-friends';
const VIEW_KEY = 'chingu-sucheop-view';

// 동그라미 색깔들
const COLORS = ['#ff9fb2', '#ffd84d', '#7fdcb6', '#8cc8ff', '#b9a8ff', '#ffb185'];

// 취업 여부 종류
const JOBS = {
  working: { label: '취업', cls: 't-working' },
  seeking: { label: '취업 준비 중', cls: 't-seeking' },
  student: { label: '학생', cls: 't-student' },
  rest:    { label: '쉬는 중', cls: 't-rest' }
};

// 처음에 보여 주는 예시 친구들
const SAMPLES = [
  { id: 's1', name: '김민지', nick: '민지', place: '서울 마포구', job: 'working', field: 'IT', group: '학교', phone: '010-1234-5678', birthday: '2000-09-27', likes: '딸기 케이크, 영화 보기', memo: '시험 기간에는 도서관에 있어요.', updated: '2026-09-20T09:00:00.000Z', sample: true },
  { id: 's2', name: '박서준', nick: '서준이', place: '경기 수원시', job: 'working', field: '제조업', group: '동네', phone: '010-2345-6789', birthday: '2001-07-21', likes: '떡볶이, 농구', memo: '토요일 아침마다 농구해요.', updated: '2026-09-20T09:00:00.000Z', sample: true },
  { id: 's3', name: '이하은', nick: '', place: '서울 관악구', job: 'student', field: '', group: '학교', phone: '010-3456-7890', birthday: '1999-11-02', likes: '고양이, 카페 탐방', memo: '카페 추천을 잘해요.', updated: '2026-09-20T09:00:00.000Z', sample: true },
  { id: 's4', name: '최지호', nick: '호야', place: '부산 해운대구', job: 'seeking', field: '', group: '모임', phone: '010-4567-8901', birthday: '', likes: '보드게임', memo: '', updated: '2026-09-20T09:00:00.000Z', sample: true },
  { id: 's5', name: '정도윤', nick: '', place: '인천 연수구', job: 'working', field: '교육', group: '동네', phone: '', birthday: '2002-04-05', likes: '', memo: '', updated: '2026-09-20T09:00:00.000Z', sample: true },
  { id: 's6', name: '한수아', nick: '수아', place: '대전 유성구', job: 'rest', field: '', group: '모임', phone: '', birthday: '', likes: '산책', memo: '', updated: '2026-09-20T09:00:00.000Z', sample: true }
];

// 친구 목록 (저장된 게 있으면 불러오고, 없으면 예시로 시작)
let friends = JSON.parse(JSON.stringify(SAMPLES));
try {
  const saved = localStorage.getItem(KEY);
  if (saved) {
    const data = JSON.parse(saved);
    if (data && Array.isArray(data.friends)) friends = data.friends;
  }
} catch (e) {
  // 저장된 게 없으면 예시 그대로 시작해요
}

function saveFriends() {
  try { localStorage.setItem(KEY, JSON.stringify({ friends: friends })); } catch (e) {}
}

// 지금 화면 상태
const state = { q: '', group: '전체', view: 'glance', openId: null, editId: null, deleteId: null };
try {
  const v = localStorage.getItem(VIEW_KEY);
  if (v === 'glance' || v === 'list') state.view = v;
} catch (e) {}

function findFriend(id) {
  for (let i = 0; i < friends.length; i++) {
    if (friends[i].id === id) return friends[i];
  }
  return null;
}

function newId() {
  return 'f' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

// ---------- 보여 줄 글자 만들기 ----------

// 동그라미 안에 들어갈 글자 (세 글자 이름이면 성을 빼고 두 글자)
function avatarText(f) {
  const n = (f.name || '').trim();
  if (/^[가-힣]{3}$/.test(n)) return n.slice(1);
  return n.slice(0, 2);
}

// 이름에 따라 정해지는 동그라미 색
function avatarColor(f) {
  let sum = 0;
  const name = f.name || '';
  for (let i = 0; i < name.length; i++) sum += name.charCodeAt(i);
  return COLORS[sum % COLORS.length];
}

// 생일까지 며칠 남았는지
function daysUntil(birthday) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(birthday || '');
  if (!m) return null;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let next = new Date(now.getFullYear(), Number(m[2]) - 1, Number(m[3]));
  if (next < today) next = new Date(now.getFullYear() + 1, Number(m[2]) - 1, Number(m[3]));
  return Math.round((next - today) / 86400000);
}

function formatBirthday(birthday) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(birthday || '');
  if (!m) return '';
  return Number(m[2]) + '월 ' + Number(m[3]) + '일';
}

// 취업 여부 색깔 딱지
function jobTag(f) {
  const j = JOBS[f.job];
  if (!j) return '';
  return '<span class="tag ' + j.cls + '">' + j.label + '</span>';
}

// 그룹 이름들 (중복 없이)
function getGroups() {
  const result = [];
  for (let i = 0; i < friends.length; i++) {
    const g = friends[i].group;
    if (g && result.indexOf(g) === -1) result.push(g);
  }
  return result.sort(function (a, b) { return a.localeCompare(b, 'ko'); });
}

// 검색어와 그룹에 맞는 친구만 골라서 이름순으로
function getVisibleFriends() {
  const q = state.q.trim().toLowerCase();
  const result = friends.filter(function (f) {
    if (state.group !== '전체' && f.group !== state.group) return false;
    if (q === '') return true;
    const text = [f.name, f.nick, f.group, f.place, f.field, f.phone, f.likes, f.memo].join(' ').toLowerCase();
    return text.indexOf(q) !== -1;
  });
  return result.sort(function (a, b) { return a.name.localeCompare(b.name, 'ko'); });
}

// ---------- 화면 그리기 ----------

function renderCount() {
  $('#count').textContent = '친구 ' + friends.length + '명';
}

function renderChips() {
  const groups = getGroups();
  if (state.group !== '전체' && groups.indexOf(state.group) === -1) state.group = '전체';
  const chips = $('#chips');
  chips.hidden = groups.length === 0;
  const all = ['전체'].concat(groups);
  let html = '';
  for (let i = 0; i < all.length; i++) {
    html += '<button type="button" class="chip" data-group="' + esc(all[i]) + '" aria-pressed="' + (state.group === all[i]) + '">' + esc(all[i]) + '</button>';
  }
  chips.innerHTML = html;
}

// 30일 안에 생일인 친구가 있으면 노란 알림
function renderBanner() {
  let best = null;
  for (let i = 0; i < friends.length; i++) {
    const d = daysUntil(friends[i].birthday);
    if (d !== null && d <= 30 && (best === null || d < best.d)) {
      best = { f: friends[i], d: d };
    }
  }
  const banner = $('#banner');
  banner.hidden = best === null;
  if (best) {
    banner.setAttribute('data-open', best.f.id);
    const when = best.d === 0 ? '오늘이에요' : best.d + '일 남았어요';
    banner.textContent = best.f.name + '의 생일이 ' + when + ' (' + formatBirthday(best.f.birthday) + ')';
  }
}

// 예시 친구가 있으면 안내 문구
function renderNote() {
  let hasSample = false;
  for (let i = 0; i < friends.length; i++) {
    if (friends[i].sample) hasSample = true;
  }
  const note = $('#note');
  note.hidden = !hasSample;
  if (hasSample) {
    note.innerHTML = '지금 보이는 친구 중에 예시가 있어요.<button type="button" id="clearSamples">예시 지우기</button>';
  }
}

function renderList() {
  const items = getVisibleFriends();
  const ul = $('#list');
  const glance = state.view === 'glance';
  ul.className = glance ? 'grid' : 'list';
  $('#viewGlance').setAttribute('aria-pressed', String(glance));
  $('#viewList').setAttribute('aria-pressed', String(!glance));

  if (items.length === 0) {
    if (friends.length === 0) {
      ul.innerHTML = '<li class="empty">아직 친구가 없어요.<br>오른쪽 위의 + 버튼으로 첫 친구를 추가해 보세요.</li>';
    } else {
      ul.innerHTML = '<li class="empty">찾는 친구가 없어요.<br>다른 말로 검색하거나 그룹을 바꿔 보세요.</li>';
    }
    return;
  }

  let html = '';
  for (let i = 0; i < items.length; i++) {
    const f = items[i];
    const d = daysUntil(f.birthday);
    let soon = '';
    if (d !== null && d <= 7) {
      soon = '<span class="pill">' + (d === 0 ? '오늘 생일' : '생일 D-' + d) + '</span>';
    }
    const avatar = '<span class="av' + (glance ? ' sm' : '') + '" style="background:' + avatarColor(f) + '" aria-hidden="true">' + esc(avatarText(f)) + '</span>';

    if (glance) {
      // 한눈에 보기: 카드 모양
      let jobCell = '<em>미입력</em>';
      if (f.job) {
        jobCell = jobTag(f);
        if (f.job === 'working' && f.field) jobCell += ' ' + esc(f.field);
      }
      let bd = '<em>미입력</em>';
      if (f.birthday) bd = esc(formatBirthday(f.birthday)) + (soon ? ' ' + soon : '');

      html += '<li><button type="button" class="pcard" data-open="' + esc(f.id) + '">' +
        '<span class="pc-head">' + avatar + '<span class="pc-name">' + esc(f.name) +
        (f.nick ? '<small>' + esc(f.nick) + '</small>' : '') + '</span></span>' +
        '<dl class="pc-info">' +
        '<div><dt>사는 곳</dt><dd>' + (f.place ? esc(f.place) : '<em>미입력</em>') + '</dd></div>' +
        '<div><dt>하는 일</dt><dd>' + jobCell + '</dd></div>' +
        '<div><dt>생일</dt><dd>' + bd + '</dd></div>' +
        '</dl></button></li>';
    } else {
      // 목록 보기: 한 줄씩
      const metaParts = [];
      if (f.place) metaParts.push(esc(f.place));
      if (f.job) metaParts.push(jobTag(f));
      const meta = metaParts.length > 0 ? metaParts.join(' ') : esc(f.group || '');

      html += '<li><button type="button" class="row" data-open="' + esc(f.id) + '">' + avatar +
        '<span><span class="name">' + esc(f.name) + (f.nick ? '<span class="nick">' + esc(f.nick) + '</span>' : '') + '</span>' +
        '<span class="meta">' + meta + '</span></span>' + soon + '</button></li>';
    }
  }
  ul.innerHTML = html;
}

function renderAll() {
  renderCount();
  renderChips();
  renderBanner();
  renderNote();
  renderList();
}

// ---------- 화면 열고 닫기 ----------

function openSheet(el, focusEl) {
  el.classList.add('open');
  if (focusEl) focusEl.focus({ preventScroll: true });
}
function closeSheet(el) {
  el.classList.remove('open');
}
function openModal(el, focusEl) {
  el.hidden = false;
  if (focusEl) focusEl.focus({ preventScroll: true });
}
function closeModal(el) {
  el.hidden = true;
}

let toastTimer;
function toast(message) {
  const t = $('#toast');
  t.textContent = message;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(function () { t.classList.remove('show'); }, 1900);
}

// ---------- 친구 상세 ----------

function detailHTML(f) {
  const rows = [];
  if (f.place) rows.push(['사는 곳', esc(f.place)]);
  if (f.job) {
    let jobHtml = jobTag(f);
    if (f.job === 'working' && f.field) jobHtml += ' ' + esc(f.field);
    rows.push(['하는 일', jobHtml]);
  }
  if (f.phone) {
    rows.push(['전화번호', '<a href="tel:' + esc(f.phone.replace(/[^\d+]/g, '')) + '">' + esc(f.phone) + '</a>']);
  }
  if (f.birthday) {
    const d = daysUntil(f.birthday);
    let pill = '';
    if (d !== null && d <= 30) pill = ' <span class="pill">' + (d === 0 ? '오늘' : 'D-' + d) + '</span>';
    rows.push(['생일', esc(formatBirthday(f.birthday)) + pill]);
  }
  if (f.likes) rows.push(['좋아하는 것', esc(f.likes)]);
  if (f.memo) rows.push(['메모', esc(f.memo)]);

  let info = '<p class="empty">아직 적어 둔 정보가 없어요.</p>';
  if (rows.length > 0) {
    info = '<dl class="info">';
    for (let i = 0; i < rows.length; i++) {
      info += '<div><dt>' + rows[i][0] + '</dt><dd>' + rows[i][1] + '</dd></div>';
    }
    info += '</dl>';
  }

  return '<div class="hero">' +
    '<span class="av big" style="background:' + avatarColor(f) + '" aria-hidden="true">' + esc(avatarText(f)) + '</span>' +
    '<h3>' + esc(f.name) + '</h3>' +
    (f.nick ? '<div class="sub">' + esc(f.nick) + '</div>' : '') +
    (f.group ? '<span class="badge">' + esc(f.group) + '</span>' : '') +
    '</div>' + info +
    '<p class="updated">마지막 수정 ' + esc(new Date(f.updated).toLocaleDateString('ko-KR')) + '</p>';
}

function openDetail(id) {
  const f = findFriend(id);
  if (!f) return;
  state.openId = id;
  $('#detailBody').innerHTML = detailHTML(f);
  $('#detailBody').scrollTop = 0;
  const sheet = $('#detail');
  if (sheet.classList.contains('open')) return;
  openSheet(sheet, $('#detailBack'));
}

function closeDetail() {
  state.openId = null;
  closeSheet($('#detail'));
}

// ---------- 친구 추가 / 수정 ----------

// 취업을 골랐을 때만 '분야' 칸을 보여 줘요
function syncJobField() {
  $('#fieldWrap').hidden = $('#fJob').value !== 'working';
}

// id가 없으면 새 친구 추가, 있으면 그 친구 수정
function openForm(id) {
  const f = id ? findFriend(id) : null;
  state.editId = f ? f.id : null;
  $('#formTitle').textContent = f ? '친구 수정' : '친구 추가';
  $('#fName').value = f ? f.name : '';
  $('#fNick').value = f ? f.nick || '' : '';
  $('#fPlace').value = f ? f.place || '' : '';
  $('#fJob').value = f ? f.job || '' : '';
  $('#fField').value = f ? f.field || '' : '';
  $('#fGroup').value = f ? f.group || '' : (state.group !== '전체' ? state.group : '');
  $('#fPhone').value = f ? f.phone || '' : '';
  $('#fBirthday').value = f ? f.birthday || '' : '';
  $('#fLikes').value = f ? f.likes || '' : '';
  $('#fMemo').value = f ? f.memo || '' : '';
  $('#nameErr').textContent = '';
  syncJobField();

  // 그룹 칸에서 지금까지 쓴 그룹 이름을 추천해 줘요
  const groups = getGroups();
  let options = '';
  for (let i = 0; i < groups.length; i++) options += '<option value="' + esc(groups[i]) + '"></option>';
  $('#groupList').innerHTML = options;

  $('#form').scrollTop = 0;
  openSheet($('#formSheet'), $('#fName'));
}

function closeForm() {
  state.editId = null;
  closeSheet($('#formSheet'));
}

$('#fJob').addEventListener('change', syncJobField);

// 저장 버튼
$('#form').addEventListener('submit', function (e) {
  e.preventDefault();
  const name = $('#fName').value.trim();
  if (name === '') {
    $('#nameErr').textContent = '이름을 적어 주세요.';
    $('#fName').focus();
    return;
  }
  const job = $('#fJob').value;
  const info = {
    name: name,
    nick: $('#fNick').value.trim(),
    place: $('#fPlace').value.trim(),
    job: job,
    field: job === 'working' ? $('#fField').value.trim() : '',
    group: $('#fGroup').value.trim(),
    phone: $('#fPhone').value.trim(),
    birthday: $('#fBirthday').value,
    likes: $('#fLikes').value.trim(),
    memo: $('#fMemo').value.trim(),
    updated: new Date().toISOString(),
    sample: false
  };

  const editing = state.editId;
  if (editing) {
    const f = findFriend(editing);
    for (const key in info) f[key] = info[key];
  } else {
    info.id = newId();
    friends.push(info);
  }

  saveFriends();
  closeForm();
  renderAll();
  if (editing) openDetail(editing);
  toast(editing ? '저장했어요' : '친구를 추가했어요');
});

// ---------- 지우기 ----------

function askDelete(id) {
  const f = findFriend(id);
  if (!f) return;
  state.deleteId = id;
  $('#confirmText').textContent = f.name + ' 친구의 정보를 지워요. 지운 정보는 되돌릴 수 없어요.';
  openModal($('#confirmModal'), $('#confirmNo'));
}

$('#confirmNo').addEventListener('click', function () { closeModal($('#confirmModal')); });
$('#confirmYes').addEventListener('click', function () {
  const id = state.deleteId;
  friends = friends.filter(function (f) { return f.id !== id; });
  state.deleteId = null;
  saveFriends();
  closeModal($('#confirmModal'));
  closeDetail();
  renderAll();
  toast('지웠어요');
});

// ---------- 버튼 눌렀을 때 ----------

$('#addBtn').addEventListener('click', function () { openForm(null); });
$('#detailBack').addEventListener('click', closeDetail);
$('#detailEdit').addEventListener('click', function () { openForm(state.openId); });
$('#detailDelete').addEventListener('click', function () { askDelete(state.openId); });
$('#formCancel').addEventListener('click', closeForm);

// 검색
$('#q').addEventListener('input', function (e) {
  state.q = e.target.value;
  renderList();
});

// 보기 방식 바꾸기
function setView(v) {
  state.view = v;
  try { localStorage.setItem(VIEW_KEY, v); } catch (e) {}
  renderList();
}
$('#viewGlance').addEventListener('click', function () { setView('glance'); });
$('#viewList').addEventListener('click', function () { setView('list'); });

// 그룹 버튼
$('#chips').addEventListener('click', function (e) {
  const b = e.target.closest('.chip');
  if (!b) return;
  state.group = b.getAttribute('data-group');
  renderChips();
  renderList();
});

// 친구 카드를 누르면 상세 화면
$('#list').addEventListener('click', function (e) {
  const b = e.target.closest('[data-open]');
  if (b) openDetail(b.getAttribute('data-open'));
});
$('#banner').addEventListener('click', function (e) {
  openDetail(e.currentTarget.getAttribute('data-open'));
});

// 예시 지우기
$('#note').addEventListener('click', function (e) {
  if (e.target.id !== 'clearSamples') return;
  friends = friends.filter(function (f) { return !f.sample; });
  saveFriends();
  renderAll();
  toast('예시를 지웠어요');
});

// Esc 키로 닫기
document.addEventListener('keydown', function (e) {
  if (e.key !== 'Escape') return;
  if (!$('#confirmModal').hidden) closeModal($('#confirmModal'));
  else if ($('#formSheet').classList.contains('open')) closeForm();
  else if ($('#detail').classList.contains('open')) closeDetail();
});

// ---------- 시작 ----------
renderAll();
