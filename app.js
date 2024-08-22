// Initial Dial Lines and clock setup
// import ollama from "ollama";

async function getCoordinates(city) {
    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)}&format=json`);

        if (!response.ok) {
            throw new Error('Network response was not ok ' + response.statusText);
        }

        const data = await response.json();

        if (data.length > 0) {
            const location = data[0];
            const { lat, lon } = location;
            return { lat, lon };
        } else {
            console.error('Geocoding API error: No results found');
            return null;
        }

    } catch (error) {
        console.error('Error fetching coordinates:', error);
        return null;
    }
}

function getWeather(city) {

}

var dialLines = document.getElementsByClassName('diallines');
var clockEl = document.getElementsByClassName('clock-face')[0];
for (var i = 0; i < 60; i++) {
    clockEl.innerHTML += "<div class='diallines'></div>";
    dialLines[i].style.transform = "rotate(" + 6 * i + "deg)";
}
for (var i = 0; i < dialLines.length; i+=5) {
    dialLines[i].style.height = "12px";
}

txt = document.querySelector('.txt')

// Clock functionality
function clock() {
    let weekday = [
            "Sun",
            "Mon",
            "Tue",
            "Wed",
            "Thu",
            "Fri",
            "Sat"
        ],
        d = new Date(),
        h = d.getHours(),
        m = d.getMinutes(),
        s = d.getSeconds(),
        date = d.getDate(),
        month = d.getMonth() + 1,
        year = d.getFullYear(),

        hDeg = h * 30 + m * (360 / 720),
        mDeg = m * 6 + s * (360 / 3600),
        sDeg = s * 6,

        hEl = document.querySelector('.hour-hand'),
        mEl = document.querySelector('.minute-hand'),
        sEl = document.querySelector('.second-hand'),
        dateEl = document.querySelector('.date'),
        dayEl = document.querySelector('.day');

    const day = weekday[d.getDay()];

    if(month < 9) {
        month = "0" + month;
    }

    hEl.style.transform = "rotate("+hDeg+"deg)";
    mEl.style.transform = "rotate("+mDeg+"deg)";
    sEl.style.transform = "rotate("+sDeg+"deg)";
    dayEl.innerHTML = day + " " + date;
}
setInterval("clock()", 100);

function getWordCount(str) {
    let words = str.trim().split(/\s+/);
    return words.length;
}

// Dial Lines moving & opacity changing
let intervalId;
function moveDialLines() {
    const dialLines = document.getElementsByClassName('diallines');

    for (var i = 0; i < dialLines.length; i++) {
        dialLines[i].style.height = "16px";

        var currentHeight = parseInt(dialLines[i].style.height) || 0;
        var newHeight = currentHeight + Math.floor(Math.random() * 21) - 10; // Random height between -10 to 10 pixels

        dialLines[i].style.height = newHeight + "px";
    }
}
function turnOn() {
    const clock = document.getElementsByClassName('clock-face')[0]; // Assuming there is only one clock element

    if (clock.classList.contains('on')) {
        clock.classList.remove('on');
        clearInterval(intervalId); // Stop the interval when unclicking

        // Set the height of each diallines element to 12px
        for (var i = 0; i < dialLines.length; i++) {
            dialLines[i].style.height = "4px";
        }
        for (var i = 0; i < dialLines.length; i+=5) {
            dialLines[i].style.height = "12px";
        }
    } else {
        clock.classList.add('on');
        intervalId = setInterval(moveDialLines, 300); // Start the interval when clicking
    }
}
clockEl.addEventListener('click', function (event) {
    turnOn()
})

function action(text, time) {
    const clock = document.getElementsByClassName('clock')[0]; // Assuming there is only one clock element
    txt.innerHTML = text;
    txt.style.opacity = 1;
    clock.style.opacity = 0;
    for (var i = 1; i < 60; i++) {
        dialLines[i].style.height = "12px";
    }

    // Hide the text after 3 seconds
    setTimeout(() => {
        txt.style.opacity = 0;
        clock.style.opacity = 1; // Optionally reset opacity of the clock

        // Set the height of each diallines element to 12px
        for (var i = 0; i < dialLines.length; i++) {
            dialLines[i].style.height = "4px";
        }
        for (var i = 0; i < dialLines.length; i+=5) {
            dialLines[i].style.height = "12px";
        }
    }, time); // 3000 milliseconds = 3 seconds
}



// Speech Recognition and TTS

function speak(text){
    const text_speak = new SpeechSynthesisUtterance(text);

    text_speak.rate = 1;
    text_speak.volume = 1;
    text_speak.pitch = 1;

    window.speechSynthesis.speak(text_speak);
}

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

const recognition =  new SpeechRecognition();

recognition.onresult = (event) => {
    //turnOn()
    const currentIndex = event.resultIndex;
    const transcript = event.results[currentIndex][0].transcript;
    takeCommand(transcript.toLowerCase());

    console.log(transcript);
    //recognition.start();
};
recognition.onend = () => {
    recognition.start();
};

document.addEventListener("DOMContentLoaded", ()=>{
    speak("listening")
    recognition.start();
})



async function ollamaAI(prompt) {
    try {

        let input = {
            role: "user",
            content: prompt
        }

        let schema = {
            "function": {
                "type": "string",
                "description": "the name of the function that should be executed"
            },
            "display": {
                "type": "string",
                "description": "the answer the user will see and hear"
            },
            "action": {
                "type": "string",
                "description": "a message to the algorithm that helps it perform a function"
            }
        }

        let d = new Date();
        let now = d.toLocaleString();
        let city = "unknown";  // Default value
        let country = "unknown";  // Default value
        const coordinates = await getCoordinates(city);
        if (coordinates) { const { lat, lon } = coordinates; }

        let messages = [
            {
                role: "system",
                content: "You are a helpful voice assistant. You are not from any specific place, and don't have any relatives. Give extremely short answers (up to 20 words)."
            },
            {
                role: "system",
                content: `This is the time and date: ${now}. The user's current location is ${city}, ${country}.`
            },
            /*{
                role: "system",
                content: `You shall output in json in the format ${schema}. If the user wants to play a song, the function is "play" and the action is the track name. If the user doesnt want to do anything specific, the function is "question" and the action is null.`
            },*/
            {
                role: "system",
                content: "The weather is..."
            }
        ];

        // Get location from API
        fetch('http://ipinfo.io/json')
            .then(response => response.json())  // Parse the JSON from the response
            .then(location => {
                city = location.city;
                country = location.country;

                // Update the second message with the retrieved location data
                messages[1].content = `This is the time and date: ${now}. The user's current location is ${city}, ${country}.`;

            })
            .catch(error => {
                console.error('Error fetching location data:', error);
            });


        messages.push(input)
        console.log('Messages:', messages);



        let output;

        const payload = {
            model: "sam4096/qwen2tools:0.5b",
            messages: messages,
            options: {temperature: 0.0},
            //format: "json",
            stream: false
        };

        await fetch('http://localhost:11434/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        })
            .then(response => response.json())
            .then(data => {
                console.log(data);
                output = data.message.content;
                messages.push(data.message);  // Use push instead of append
            })
            .catch(error => {
                console.error('Error:', error);
            });

        return output;


    } catch (error) {
        console.error('Error:', error);
    }
}

// Commands
async function takeCommand(message) {
    let assistantName = "Aura";
    let assistantNameVariation = "dora";

    if (message.includes('calculate')) {
        let calculation = message.replace("calculate", "").trim();

        // Replace text-based operators with mathematical operators
        let expression = calculation
            .replace(/to the power of/g, "**")
            .replace(/times/g, "*")
            .replace(/over/g, "/");

        try {
            // Use math.js to evaluate the expression
            let result = math.evaluate(expression);

            // Round to 2 decimal places if necessary
            if (typeof result === 'number' && result % 1 !== 0) {
                result = parseFloat(result.toFixed(2));
            }

            // Display the result
            let displayExpression = calculation
                .replace(/\*\*/g, "^")
                .replace(/\*/g, "×")
                .replace(/\//g, "÷")
                .replace(/\s+/g, "");

            let text = `<p style="font-weight: lighter; font-size: 50%; color: #b1b1b1;">${displayExpression}=</p>${result}`;
            action(text, 3000);

        } catch (error) {
            console.error('Error evaluating calculation:', error);
        }
    }
        // If music is playing on spotify, diallines should move
    // show (shows playing track), play/pause, volume - voice commands

    else if (message.includes(assistantName.toLowerCase()) || message.includes(assistantNameVariation)) {

        let prompt = message
            .replace(assistantName, "")
            .replace(assistantNameVariation, "")
            .trim();

        try {
            let kai = await ollamaAI(prompt);

            if (getWordCount(kai) > 30){
                kai = "I can't answer that at the moment."
            }

            action(`<p style='font-size:35%;'>${kai}</p>`, getWordCount(kai) * 500);

        } catch (error) {
            console.error('Error:', error);
            action(`<p style='font-size:35%;'>${assistantName} is not available right now...</p>`, 3000);
        }
    }

    /*
    else{
        console.log(message);
        speak(message);
    }  // For testing
    */
}
