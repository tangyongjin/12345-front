let isRecording = false;
let mediaRecorder;
let audioChunks = [];

console.log("Hello, 🌻🌻🌻🌻 ,World!");

var tags_12345 = [
  "经济调节",
  "市场监管",
  "社会管理",
  "公共服务",
  "生态环境保护",
  '未知'
];

var tagCloud = TagCloud("#tagcloud", tags_12345);

import AudioMotionAnalyzer from "./audiomotion-analyzer.js";

const recordButton = document.getElementById("recordButton");
const statusElement = document.getElementById("status");


// llm selector 

var activities = document.getElementById("llm_provider");

activities.addEventListener("click", function() {
    var options = activities.querySelectorAll("option");
    var count = options.length;
});

activities.addEventListener("change", function() {
  console.log(activities.value);
  localStorage.setItem("llm_provider", activities.value);

});



const audioMotion = new AudioMotionAnalyzer(
  document.getElementById("container"),
  {
    gradient: "rainbow",
    height: 300,
    showScaleY: true,
  }
);


recordButton.addEventListener("click", async () => {
  if (!isRecording) {
    isRecording = true;
    recordButton.innerText = "🎤  停止录音";

    if (navigator.mediaDevices) {
      navigator.mediaDevices
        .getUserMedia({ audio: true, video: false })
        .then((stream) => {
          const micStream = audioMotion.audioCtx.createMediaStreamSource(stream);
          audioMotion.connectInput(micStream);
          audioMotion.volume = 0;
        })
        .catch((err) => {
          alert("Microphone access denied by user");
        });
    } else {
      alert("User mediaDevices not available");
    }

    await startRecording();
  } else {
    isRecording = false;
    audioMotion.disconnectInput();
    recordButton.innerText = "🎤  开始录音";
    await stopRecording();
  }
});

function typewriting(domid, text, callback) {
  var index = 0;

  function type() {
    document.getElementById(domid).value = text.substring(0, index++);
    if (index > text.length) {
      clearInterval(interval);
      callback(); // 调用回调函数
    }
  }

  var interval = setInterval(type, 100);
}

async function startRecording() {
  const input = document.getElementById("transcribe");
  input.value = "  ";
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  mediaRecorder = new MediaRecorder(stream);
  mediaRecorder.addEventListener("dataavailable", (event) => {
    audioChunks.push(event.data);
  });
  mediaRecorder.start();
  statusElement.textContent = "Recording...";
}

function stopRecording() {
  return new Promise((resolve) => {
    mediaRecorder.addEventListener("stop", async () => {
      statusElement.textContent = "Recording stopped.";
      const audioBlob = new Blob(audioChunks);
      audioChunks = [];
      const formData = new FormData();
      formData.append("audio", audioBlob);

      
      document.getElementById("loading").style.display = "block";
      const url="http://127.0.0.1:8087/transcribe_gpt"
      
      const response = await fetch(url, { method: "POST", body: formData });
      const { transcription, answer } = await response.json();
      document.getElementById("loading").style.display = "none";
      const input = document.getElementById("transcribe");
      typewriting("transcribe", transcription, function () {
        console.log("Typewriting completed."); // 在回调函数中执行其他语句
        speak(answer);
        console.log("销毁,重新计算");
        const index = tags_12345.indexOf(answer);
        if (index !== -1) {
          tags_12345[index] = answer + "+";
        }
        tagCloud.update(tags_12345);

        resolve();
      });
    });

    mediaRecorder.stop();
  });
}

// 语言报出结果
function speak(text) {

  const synth = window.speechSynthesis;
  let u = new SpeechSynthesisUtterance();
  u.lang = "zh-TW";
  u.text = text;
  synth.speak(u);
}
