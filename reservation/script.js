// ==========================
// Apps Script URL
// ==========================
const API = "https://script.google.com/macros/s/AKfycbyt3GrabbJGEzYada4aUKKCQcjsA2YWK-Z9IQTB_QmNlr8DTO-pIAe9QXlbHfUg3IG9/exec";

// ==========================
// 예약 시간 설정
// ==========================
const START_HOUR = 10;
const END_HOUR = 17;
const INTERVAL = 10;

// ==========================
// 예약 시간 생성
// ==========================
const times = [];

for (let h = START_HOUR; h < END_HOUR; h++) {

    for (let m = 0; m < 60; m += INTERVAL) {

        times.push(
            `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
        );

    }

}

// ==========================
// 시간 목록 출력
// ==========================
const select = document.getElementById("time");

times.forEach(time => {

    const option = document.createElement("option");

    option.value = time;
    option.textContent = time;

    select.appendChild(option);

});

// ==========================
// 시작 시 예약 목록 불러오기
// ==========================
loadReserved();

// 30초마다 자동 갱신
setInterval(loadReserved, 30000);

// ==========================
// 예약 현황 조회
// ==========================
async function loadReserved() {

    try {

        // 초기화
        [...select.options].forEach(option => {

            option.disabled = false;
            option.textContent = option.value;

        });

        const response = await fetch(API + "?t=" + Date.now());

        const reserved = await response.json();

        // 시간별 예약 인원 계산
        const countMap = {};

        reserved.forEach(row => {

            const time = row[0];
            const people = Number(row[4]);

            countMap[time] =
                (countMap[time] || 0) + people;

        });

        // 표시
        Object.keys(countMap).forEach(time => {

            const option =
                [...select.options].find(o => o.value === time);

            if (!option) return;

            const count = countMap[time];

            if (count >= 5) {

                option.disabled = true;
                option.textContent =
                    `${time} (5/5 예약마감)`;

            }

            else {

                option.textContent =
                    `${time} (${count}/5)`;

            }

        });

    }

    catch (error) {

        console.error(error);

    }

}

// ==========================
// 예약하기
// ==========================
async function reserve() {

    const time = document.getElementById("time").value;
    const name = document.getElementById("name").value.trim();
    const student = document.getElementById("student").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const people = document.getElementById("people").value;

    // 이름 검사
    if (name === "") {

        alert("이름을 입력해주세요.");
        return;

    }

    // 학번 검사
    if (!/^\d{5}$/.test(student)) {

        alert("학번은 5자리 숫자로 입력해주세요.");
        return;

    }

    // 전화번호 검사
    if (!/^01\d{8,9}$/.test(phone)) {

        alert("전화번호를 올바르게 입력해주세요.");
        return;

    }

    const button = document.querySelector("button");

    button.disabled = true;
    button.textContent = "예약 중...";

    try {

        const response = await fetch(API, {

            method: "POST",

            body: JSON.stringify({

                time,
                name,
                student,
                phone,
                people

            })

        });

        const result = await response.text();

        console.log(result);

        switch (result) {

            case "success":

                document.getElementById("result").innerHTML = `
                    <h3>✅ 예약 완료</h3>
                    <p><strong>예약 시간</strong> : ${time}</p>
                    <p><strong>이름</strong> : ${name}</p>
                    <p><strong>학번</strong> : ${student}</p>
                    <p><strong>전화번호</strong> : ${phone}</p>
                    <p><strong>인원</strong> : ${people}명</p>
                `;

                document.getElementById("name").value = "";
                document.getElementById("student").value = "";
                document.getElementById("phone").value = "";
                document.getElementById("people").value = "1";

                await loadReserved();

                break;

            case "duplicate_student":

                alert("이미 예약한 학번입니다.");
                break;

            case "full":

                alert("해당 시간은 정원(5명)이 모두 찼습니다.");

                await loadReserved();

                break;

            case "invalid":

                alert("입력값이 올바르지 않습니다.");
                break;

            default:

                alert("예약에 실패했습니다.");
                console.log(result);

        }

    }

    catch (error) {

        console.error(error);

        alert("서버 오류가 발생했습니다.");

    }

    button.disabled = false;
    button.textContent = "예약하기";

}