// --- Game State ---
let score = 0;
let day = 1;
let mode = ""; // "casual" or "timed"
let currentOrder = "";
let cipherRules = {};
let correctAnswer = "";
let selectedOption = null;
let ordersServed = 0;
let stars = [];
const ORDERS_PER_DAY_DEFAULT = 5;
let ORDERS_PER_DAY = ORDERS_PER_DAY_DEFAULT;
let dayLog = [];
let timerInterval = null;
let timeLeft = 0;
let timeMode = 0;

let coins = 0;
let hintsUsed = 0;
const MAX_HINTS_PER_DAY = 2;


// --- Morse Code Mapping for Day 2 ---
const morseMapping = {
  ".-": "Coffee",
  "..": "Iced Coffee",
  "--": "Matcha",
  "-": "Tea",
  "-.-.": "Chocolate",
  "--..": "Milk",
  "...": "Sugar",
  ".--.": "Syrup",
  "..-..": "Double"
};

// --- Cipher rules per day ---
function getCipherRules(day) {
  if (day === 1) {
    return { 
      "☕": "Coffee",
      "I": "Iced Coffee",
      "M": "Matcha",   // capital M for Matcha
      "m": "Milk",     // small m for Milk
      "T": "Tea",
      "C": "Chocolate",
      "S": "Sugar",
      "s": "Syrup",   
      "2": "Double"
    };
  } else if (day === 2) {
    return morseMapping;
  } else if (day === 3) {
    return {
      "Δ": "Coffee",
      "#": "Iced Coffee",
      "/\\/\\": "Matcha",
      "Λ": "Tea",
      "⊡": "Chocolate",
      "◇": "Milk",
      "::": "Sugar",
      "♧": "Syrup",
      "||": "Double"
    };
  }
}

// --- Decode Order ---
function decodeOrder(order) {
  if (day === 2) {
    const symbols = order.trim().split(" ");
    const parts = symbols.map(s => morseMapping[s] || "?");
    return parts.join(" + ");
  } else {
    const parts = [];
    for (let i = 0; i < order.length;) {
      if (order.substring(i,i+2)==="::" || order.substring(i,i+2)==="||") {
        parts.push(cipherRules[order.substring(i,i+2)]);
        i+=2;
      } else if (order.substring(i,i+4)==="/\\/\\") {
        parts.push(cipherRules["/\\/\\"]);
        i+=4;
      } else {
        parts.push(cipherRules[order[i]]);
        i++;
      }
    }
    return parts.join(" + ");
  }
}

// ---------- Normalization helper (replace your current normalizeDecoded) ----------
function normalizeDecoded(decoded){
  // Turn "Coffee + Double + Sugar" into sorted, trimmed canonical string
  // e.g. -> "Coffee + Double + Sugar" (sorted alphabetically if necessary)
  if (!decoded || typeof decoded !== "string") return "";
  const parts = decoded.split("+").map(s => s.trim()).filter(s => s.length>0);
  parts.sort((a,b)=> a.localeCompare(b)); // stable, language-aware sort
  return parts.join(" + ");
}

// --- Menu Options ---
function buildMenu(){
  const menuEl = document.getElementById("menu");
  menuEl.innerHTML="";
  const options = [
    "Coffee + Milk",
    "Coffee + Double + Sugar",
    "Tea + Double + Syrup",
    "Coffee + Sugar",
    "Coffee + Double + Syrup",
    "Tea + Milk",
    "Coffee + Double + Milk",
    "Tea + Sugar",
    "Iced Coffee + Milk",
    "Iced Coffee + Double + Syrup",
    "Matcha + Milk",
    "Matcha + Syrup",
    "Chocolate + Syrup",
    "Matcha + Double + Sugar",
    "Coffee + Syrup",
    //added options 
    "Chocolate + Milk",
    "Tea + Double + Sugar",
    "Iced Coffee + Double + Milk",
    "Matcha + Double + Syrup",
    "Chocolate + Double + Syrup"
  ];
  options.forEach(optText=>{
    const btn = document.createElement("button");
    btn.className="option";
    btn.type="button";
    btn.innerText=optText;
    btn.dataset.value=optText;
    btn.addEventListener("click",()=>{
      document.querySelectorAll(".option").forEach(b=>b.classList.remove("selected"));
      btn.classList.add("selected");
      selectedOption = btn.dataset.value;
    });
    menuEl.appendChild(btn);
  });
}

// --- Possible Orders per Day ---
function getPossibleOrders(day){
  if(day===1){
    return [
      "☕m",        // Coffee + Milk
      "☕2S",       // Coffee + Double + Sugar
      "T2s",       // Tea + Double + Syrup
      "☕S",        // Coffee + Sugar
      "☕2s",       // Coffee + Double + Syrup
      "Tm",       // Tea + Milk
      "☕2m",       // Coffee + Double + Milk
      "TS",       // Tea + Sugar
      "Im",       // Iced Coffee + Milk
      "I2s",      // Iced Coffee + Double + Syrup
      "Mm",       // Matcha + Milk
      "Ms",       // Matcha + Syrup
      "Cs",       // Chocolate + Syrup
      "M2S",       // Matcha + Double + Sugar
      "☕s",       // Coffee + Syrup
      "Cm",       // Chocolate + Milk
      "T2S",       // Tea + Double + Sugar
      "I2m",      // Iced Coffee + Double + Milk
      "M2s",       // Matcha + Double + Syrup
      "C2s"        // Chocolate + Double + Syrup
    ];
  } else if(day===2){
    return [
      ".- --..", // Coffee + Milk
      ".- ..-.. ...", // Coffee + Double + Sugar 
      "- ..-.. .--.", // Tea + Double + Syrup
      ".- ...", // Coffee + Sugar
      ".- ..-.. .--.", // Coffee + Double + Syrup
      "- --..", // Tea + Milk
      ".- ..-.. --..", // Coffee + Double + Milk
      "- ...", // Tea + Sugar
      ".. --..", // Iced Coffee + Milk
      ".. ..-.. .--.", // Iced Coffee + Double + Syrup
      "-- --..", // Matcha + Milk
      "-- .--.", // Matcha + Syrup
      "-.-. .--.", // Chocolate + Syrup
      "-- ..-.. ...", // Matcha + Double + Sugar
      ".- .--.",  // Coffee + Syrup
      "-.-. --..", // Chocolate + Milk
      "- ..-.. ...", // Tea + Double + Sugar
      ".. ..-.. --..", // Iced Coffee + Double + Milk
      "-- ..-.. .--.", // Matcha + Double + Syrup
      "-.-. ..-.. .--." // Chocolate + Double + Syrup
    ];
  } else if(day===3){
    return [
        "Δ◇", // Coffee + Milk
        "Δ||::", // Coffee + Double + Sugar
        "Λ||♧", // Tea + Double + Syrup
        "Δ::", // Coffee + Sugar
        "Δ||♧", // Coffee + Double + Syrup
        "Λ◇", // Tea + Milk
        "Δ||◇", // Coffee + Double + Milk
        "Λ::", // Tea + Sugar
        "#◇", // Iced Coffee + Milk
        "#||♧", // Iced Coffee + Double + Syrup
        "/\\/\\◇", // Matcha + Milk
        "/\\/\\♧" , // Matcha + Syrup
        "⊡♧", // Chocolate +  Syrup
        "/\\/\\||::", // Matcha + Double + Sugar
        "Δ♧", // Coffee + Syrup
        "⊡◇", // Chocolate + Milk
        "Λ||::", // Tea + Double + Sugar
        "#||◇", // Iced Coffee + Double + Milk
        "/\\/\\||♧", // Matcha + Double + Syrup
        "⊡||♧" // Chocolate + Double + Syrup

    ];
  }
}

// --- Generate Order ---
// ---------- Update generateOrder (ensure correctAnswer is canonical) ----------
function generateOrder(){
  const possible = getPossibleOrders(day);
  currentOrder = possible[Math.floor(Math.random()*possible.length)];
  document.getElementById("order").innerText="Order: "+currentOrder;

  // Ensure correctAnswer is stored in canonical form
  correctAnswer = normalizeDecoded(decodeOrder(currentOrder));

  // Reset selection UI
  selectedOption = null;
  document.querySelectorAll(".option").forEach(b=>b.classList.remove("selected"));

  // Debugging (uncomment to inspect)
  // console.log("Generated order:", currentOrder);
  // console.log("Decoded correctAnswer:", correctAnswer);
}

//order gif
function showOrderGif() {
  function matches(answer, target) {
    return normalizeDecoded(answer) === normalizeDecoded(target);
  }

  const orderFeedbackEl = document.getElementById("order-feedback");
  orderFeedbackEl.style.display = "block"; // show the feedback

  let message = "✅ Delicious! The customer loved it!";


  if (matches(correctAnswer, "Coffee + Milk")) {
    document.getElementById("order-served-gif").style.display = "block";
    document.getElementById("coffee-milk-gif").style.display = "block";
    document.getElementById("game").style.display = "none";
    document.getElementById("continue-btn").style.display = "inline-block";
    orderFeedbackEl.innerText = message;

    document.getElementById("continue-btn").addEventListener("click",()=> {
     document.getElementById("order-served-gif").style.display = "none";
     document.getElementById("coffee-milk-gif").style.display = "none";
      orderFeedbackEl.style.display = "none";
     document.getElementById("game").style.display = "block";

    });
  }
  if(matches(correctAnswer, "Coffee + Double + Sugar")){
    document.getElementById("order-served-gif").style.display = "block";
    document.getElementById("coffee-double-sugar-gif").style.display = "block";
    document.getElementById("game").style.display = "none";
    document.getElementById("continue-btn").style.display = "inline-block";
    orderFeedbackEl.innerText = message;

    document.getElementById("continue-btn").addEventListener("click",()=> {
      document.getElementById("order-served-gif").style.display = "none";
      document.getElementById("coffee-double-sugar-gif").style.display = "none";
      orderFeedbackEl.style.display = "none";
     document.getElementById("game").style.display = "block";
    });
  }
  
  if (matches(correctAnswer,"Tea + Double + Syrup")) {
    document.getElementById("order-served-gif").style.display = "block";
    document.getElementById("tea-double-syrup-gif").style.display = "block";
    document.getElementById("game").style.display = "none";
    document.getElementById("continue-btn").style.display = "inline-block";
    orderFeedbackEl.innerText = message;

    document.getElementById("continue-btn").addEventListener("click",()=> {
      document.getElementById("order-served-gif").style.display = "none";
      document.getElementById("tea-double-syrup-gif").style.display = "none";
      orderFeedbackEl.style.display = "none";
      document.getElementById("game").style.display = "block"; 
  });

}

if (matches(correctAnswer, "Coffee + Sugar")) {
    document.getElementById("order-served-gif").style.display = "block";
    document.getElementById("coffee-sugar-gif").style.display = "block";
    document.getElementById("game").style.display = "none";
    document.getElementById("continue-btn").style.display = "inline-block";
    orderFeedbackEl.innerText = message;

    document.getElementById("continue-btn").addEventListener("click",()=> {
      document.getElementById("order-served-gif").style.display = "none";
      document.getElementById("coffee-sugar-gif").style.display = "none";
      orderFeedbackEl.style.display = "none";
      document.getElementById("game").style.display = "block";
    });

  }

if (matches(correctAnswer, "Coffee + Double + Syrup")) {
    document.getElementById("order-served-gif").style.display = "block";
    document.getElementById("coffee-double-syrup-gif").style.display = "block";
    document.getElementById("game").style.display = "none";
    document.getElementById("continue-btn").style.display = "inline-block";
    orderFeedbackEl.innerText = message;

    document.getElementById("continue-btn").addEventListener("click",()=> {
      document.getElementById("order-served-gif").style.display = "none";
      document.getElementById("coffee-double-syrup-gif").style.display = "none";
      orderFeedbackEl.style.display = "none";
      document.getElementById("game").style.display = "block";
    });
}

if (matches(correctAnswer, "Tea + Milk")) {
    document.getElementById("order-served-gif").style.display = "block";
    document.getElementById("tea-milk-gif").style.display = "block";
    document.getElementById("game").style.display = "none";
    document.getElementById("continue-btn").style.display = "inline-block";
    orderFeedbackEl.innerText = message;

    document.getElementById("continue-btn").addEventListener("click",()=> {
      document.getElementById("order-served-gif").style.display = "none";
      document.getElementById("tea-milk-gif").style.display = "none";
      orderFeedbackEl.style.display = "none";
      document.getElementById("game").style.display = "block";
    });
}

if (matches(correctAnswer, "Coffee + Double + Milk")) {
    document.getElementById("order-served-gif").style.display = "block";
    document.getElementById("coffee-2-milk-gif").style.display = "block";
    document.getElementById("game").style.display = "none";
    document.getElementById("continue-btn").style.display = "inline-block";
    orderFeedbackEl.innerText = message;

    document.getElementById("continue-btn").addEventListener("click",()=> {
      document.getElementById("order-served-gif").style.display = "none";
      document.getElementById("coffee-2-milk-gif").style.display = "none";
      orderFeedbackEl.style.display = "none";
      document.getElementById("game").style.display = "block";
    });
  }

  if (matches(correctAnswer, "Tea + Sugar")){
     document.getElementById("order-served-gif").style.display = "block";
     document.getElementById("tea-sugar-gif").style.display = "block";
     document.getElementById("game").style.display = "none";
     document.getElementById("continue-btn").style.display = "inline-block";
     orderFeedbackEl.innerText = message;

     document.getElementById("continue-btn").addEventListener("click",()=> {
       document.getElementById("order-served-gif").style.display = "none";
       document.getElementById("tea-sugar-gif").style.display = "none";
       orderFeedbackEl.style.display = "none";
       document.getElementById("game").style.display = "block";
    });
  }

  if(matches(correctAnswer,"Iced Coffee + Milk")){
     document.getElementById("order-served-gif").style.display = "block";
     document.getElementById("icedcoffee-milk-gif").style.display = "block";
     document.getElementById("game").style.display = "none";
     document.getElementById("continue-btn").style.display = "inline-block";
     orderFeedbackEl.innerText = message;

     document.getElementById("continue-btn").addEventListener("click",()=> {
       document.getElementById("order-served-gif").style.display = "none";
       document.getElementById("icedcoffee-milk-gif").style.display = "none";
       orderFeedbackEl.style.display = "none";
       document.getElementById("game").style.display = "block";
    });    
  }

  if(matches(correctAnswer, "Iced Coffee + Double + Syrup")) {
     document.getElementById("order-served-gif").style.display = "block";
     document.getElementById("icedcoffee-2-syrup-gif").style.display = "block";
     document.getElementById("game").style.display = "none";
     document.getElementById("continue-btn").style.display = "inline-block";
     orderFeedbackEl.innerText = message;

     document.getElementById("continue-btn").addEventListener("click",()=> {
       document.getElementById("order-served-gif").style.display = "none";
       document.getElementById("icedcoffee-2-syrup-gif").style.display = "none";
       orderFeedbackEl.style.display = "none";
       document.getElementById("game").style.display = "block";
    });       
  }

  if (matches(correctAnswer,"Matcha + Milk")) {
     document.getElementById("order-served-gif").style.display = "block";
     document.getElementById("matcha-milk-gif").style.display = "block";
     document.getElementById("game").style.display = "none";
     document.getElementById("continue-btn").style.display = "inline-block";
     orderFeedbackEl.innerText = message;

     document.getElementById("continue-btn").addEventListener("click",()=> {
       document.getElementById("order-served-gif").style.display = "none";
       document.getElementById("matcha-milk-gif").style.display = "none";
       orderFeedbackEl.style.display = "none";
       document.getElementById("game").style.display = "block";
    });     
  }

  if (matches(correctAnswer,"Matcha + Syrup")) {
     document.getElementById("order-served-gif").style.display = "block";
     document.getElementById("matcha-syrup-gif").style.display = "block";
     document.getElementById("game").style.display = "none";
     document.getElementById("continue-btn").style.display = "inline-block";
     orderFeedbackEl.innerText = message;

     document.getElementById("continue-btn").addEventListener("click",()=> {
       document.getElementById("order-served-gif").style.display = "none";
       document.getElementById("matcha-syrup-gif").style.display = "none";
       orderFeedbackEl.style.display = "none";
       document.getElementById("game").style.display = "block";
    });        
  }

  if (matches(correctAnswer, "Chocolate + Syrup")) {
     document.getElementById("order-served-gif").style.display = "block";
     document.getElementById("chocolate-syrup-gif").style.display = "block";
     document.getElementById("game").style.display = "none";
     document.getElementById("continue-btn").style.display = "inline-block";
     orderFeedbackEl.innerText = message;

     document.getElementById("continue-btn").addEventListener("click",()=> {
       document.getElementById("order-served-gif").style.display = "none";
       document.getElementById("chocolate-syrup-gif").style.display = "none";
       orderFeedbackEl.style.display = "none";
       document.getElementById("game").style.display = "block";
    });     
  }

  if(matches(correctAnswer, "Matcha + Double + Sugar")) {
     document.getElementById("order-served-gif").style.display = "block";
     document.getElementById("matcha-2-sugar-gif").style.display = "block";
     document.getElementById("game").style.display = "none";
     document.getElementById("continue-btn").style.display = "inline-block";
     orderFeedbackEl.innerText = message;

     document.getElementById("continue-btn").addEventListener("click",()=> {
       document.getElementById("order-served-gif").style.display = "none";
       document.getElementById("matcha-2-sugar-gif").style.display = "none";
       orderFeedbackEl.style.display = "none";
       document.getElementById("game").style.display = "block";
    });         
  }

  if(matches(correctAnswer, "Coffee + Syrup")) {
     document.getElementById("order-served-gif").style.display = "block";
     document.getElementById("coffee-syrup-gif").style.display = "block";
     document.getElementById("game").style.display = "none";
     document.getElementById("continue-btn").style.display = "inline-block";
     orderFeedbackEl.innerText = message;

     document.getElementById("continue-btn").addEventListener("click",()=> {
       document.getElementById("order-served-gif").style.display = "none";
       document.getElementById("coffee-syrup-gif").style.display = "none";
       orderFeedbackEl.style.display = "none";
       document.getElementById("game").style.display = "block";
    });      
  }

  if(matches(correctAnswer, "Chocolate + Milk")) {
     document.getElementById("order-served-gif").style.display = "block";
     document.getElementById("chocolate-milk-gif").style.display = "block";
     document.getElementById("game").style.display = "none";
     document.getElementById("continue-btn").style.display = "inline-block";
     orderFeedbackEl.innerText = message;

     document.getElementById("continue-btn").addEventListener("click",()=> {
       document.getElementById("order-served-gif").style.display = "none";
       document.getElementById("chocolate-milk-gif").style.display = "none";
       orderFeedbackEl.style.display = "none";
       document.getElementById("game").style.display = "block";
    });     
  }

  if (matches(correctAnswer,"Tea + Double + Sugar")) {
     document.getElementById("order-served-gif").style.display = "block";
     document.getElementById("tea-2-sugar-gif").style.display = "block";
     document.getElementById("game").style.display = "none";
     document.getElementById("continue-btn").style.display = "inline-block";
     orderFeedbackEl.innerText = message;

     document.getElementById("continue-btn").addEventListener("click",()=> {
       document.getElementById("order-served-gif").style.display = "none";
       document.getElementById("tea-2-sugar-gif").style.display = "none";
       orderFeedbackEl.style.display = "none";
       document.getElementById("game").style.display = "block";
    });   
  }

  if (matches(correctAnswer, "Iced Coffee + Double + Milk")) {
     document.getElementById("order-served-gif").style.display = "block";
     document.getElementById("icedcoffee-2-milk-gif").style.display = "block";
     document.getElementById("game").style.display = "none";
     document.getElementById("continue-btn").style.display = "inline-block";
     orderFeedbackEl.innerText = message;

     document.getElementById("continue-btn").addEventListener("click",()=> {
       document.getElementById("order-served-gif").style.display = "none";
       document.getElementById("icedcoffee-2-milk-gif").style.display = "none";
       orderFeedbackEl.style.display = "none";
       document.getElementById("game").style.display = "block";
    });     
  }

  if (matches(correctAnswer, "Matcha + Double + Syrup")) {
     document.getElementById("order-served-gif").style.display = "block";
     document.getElementById("matcha-2-syrup-gif").style.display = "block";
     document.getElementById("game").style.display = "none";
     document.getElementById("continue-btn").style.display = "inline-block";
     orderFeedbackEl.innerText = message;

     document.getElementById("continue-btn").addEventListener("click",()=> {
       document.getElementById("order-served-gif").style.display = "none";
       document.getElementById("matcha-2-syrup-gif").style.display = "none";
       orderFeedbackEl.style.display = "none";
       document.getElementById("game").style.display = "block";
    });    
  }

  if (matches(correctAnswer, "Chocolate + Double + Syrup")){
     document.getElementById("order-served-gif").style.display = "block";
     document.getElementById("chocolate-2-syrup-gif").style.display = "block";
     document.getElementById("game").style.display = "none";
     document.getElementById("continue-btn").style.display = "inline-block";
     orderFeedbackEl.innerText = message;

     document.getElementById("continue-btn").addEventListener("click",()=> {
       document.getElementById("order-served-gif").style.display = "none";
       document.getElementById("chocolate-2-syrup-gif").style.display = "none";
       orderFeedbackEl.style.display = "none";
       document.getElementById("game").style.display = "block";
    });  
  }



} 



// ---------- Replace serve() with this robust comparator ----------
function serve(){
  const feedbackEl = document.getElementById("feedback");
  if(!selectedOption){
    feedbackEl.innerText="Choose an option from the menu first.";
    return;
  }

  // Canonicalize player's choice the same way we canonicalize decoded answers
  const normalizedSelected = normalizeDecoded(selectedOption);
  
  // Debugging (uncomment if needed)
  // console.log("Player selection (raw):", selectedOption);
  // console.log("Player selection (norm):", normalizedSelected);
  // console.log("Correct answer (norm):", correctAnswer);

  // Compare canonical strings
  const isCorrect = normalizedSelected === correctAnswer;
  if (isCorrect) {
  coins += 1; // earn one coin for correct answer
  updateCoins();
  showOrderGif();
}

  if(!isCorrect)
  {
     document.getElementById("order-served-gif").style.display = "block";
     document.getElementById("game").style.display = "none";
     document.getElementById("continue-btn").style.display = "inline-block";
     document.getElementById("order-feedback-2").style.display = "block";

     document.getElementById("continue-btn").addEventListener("click",()=> {
       document.getElementById("order-served-gif").style.display = "none";
        document.getElementById("order-feedback-2").style.display = "none";
       document.getElementById("game").style.display = "block";
     });


  }


  const starCount = giveStarRating(isCorrect);
  stars.push(starCount);
  feedbackEl.innerHTML=(isCorrect?"✅ Correct! ":"❌ Wrong. ")+renderStars(starCount);
  score += isCorrect?10:-5;

  dayLog.push({order:currentOrder,correct:correctAnswer,player:selectedOption,stars:starCount});

  updateScore();
  ordersServed++;
  document.getElementById("stars-left").innerText="Orders left today: "+(ORDERS_PER_DAY-ordersServed);
  if(mode==="casual" && ordersServed>=ORDERS_PER_DAY){
    setTimeout(endOfDay,1000);
  } else if(mode==="timed"){
    generateOrder();
    timeMode ++;
  document.getElementById("orders-count").innerText="Orders served: " + timeMode;
  } else {
    setTimeout(generateOrder,1000);
  }
}

// --- Stars ---
function giveStarRating(isCorrect){ return isCorrect?Math.floor(Math.random()*2)+4:Math.floor(Math.random()*3); }
function renderStars(num){ return `<span class="stars">${"⭐".repeat(num)}</span>`; }

// --- End of Day ---
function endOfDay(){
  
  clearInterval(timerInterval);
  const sum = stars.reduce((a,b)=>a+b,0);
  const avg = sum/stars.length;
  const avgRounded = Math.round(avg*10)/10;
  const summary = document.getElementById("summary-content");
  const starVisual = renderStars(Math.round(avg));

  let tableHTML=`<table><thead><tr><th>Order</th><th>Correct</th><th>Your Answer</th><th>Stars</th></tr></thead><tbody>`;
  dayLog.forEach(entry=>{
    tableHTML+=`<tr>
      <td>${entry.order}</td>
      <td>${entry.correct}</td>
      <td>${entry.player}</td>
      <td>${renderStars(entry.stars)}</td>
    </tr>`;
  });
  tableHTML+=`</tbody></table>`;

  summary.innerHTML=`<p><strong>Day ${day} complete!</strong></p>
    <p>Average Rating: ${starVisual} (${avgRounded})</p>
    <p>Orders served: ${stars.length}</p>
    ${tableHTML}`;

  const nextBtn = document.getElementById("next-day-btn");
  const restartBtn = document.getElementById("restart-btn");
  if(day<3 && avg>=3){
    summary.innerHTML+=`<p>Great job! The café stays open tomorrow.</p>`;
    document.getElementById("Happy").style.display="block";
    document.querySelectorAll('#order-served-gif img').forEach(img => img.style.display = 'none');
    document.getElementById("order-served-gif").style.display = "none";
    nextBtn.style.display="inline-block";
    restartBtn.style.display="inline-block";
  } else if(day<3 && avg<3){
    summary.innerHTML+=`<p>The café's reputation dropped too low... Retry this day!</p>`;
    document.getElementById("Sad").style.display="block";
    document.querySelectorAll('#order-served-gif img').forEach(img => img.style.display = 'none');
    document.getElementById("order-served-gif").style.display = "none";
    nextBtn.style.display="none";
    restartBtn.style.display="inline-block";
  } else if(day===3){
    summary.innerHTML+=`<p>End of Day 3. Thanks for playing!</p>`;
    document.getElementById("Happy").style.display="block";
    document.querySelectorAll('#order-served-gif img').forEach(img => img.style.display = 'none');
    document.getElementById("order-served-gif").style.display = "none";
    nextBtn.style.display="none";
    restartBtn.style.display="inline-block";
  }
  
  showSummary();
  
}

// --- Timer for Timed Mode ---
function startTimer(){
  if(mode!=="timed") return;
  timeLeft=120;
  const timerEl=document.getElementById("timer");
  timerEl.innerText=formatTime(timeLeft);
  timerInterval=setInterval(()=>{
    timeLeft--;
    timerEl.innerText=formatTime(timeLeft);
    if(timeLeft<=0){
      endOfDay();
    }
  },1000);
}
function formatTime(seconds){
  const m=Math.floor(seconds/60);
  const s=seconds%60;
  return `${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
}

// --- UI Helpers ---
function showSummary(){ document.getElementById("game").style.display="none"; document.getElementById("summary").style.display="block"; 
   document.querySelectorAll('#order-served-gif img').forEach(img => img.style.display = 'none');
}
function nextDay(){
  day++;
  resetDayState();
  document.getElementById("Sad").style.display="none";
  document.getElementById("Happy").style.display="none";
  document.getElementById("summary").style.display="none";
  document.getElementById("game").style.display="block";
  document.getElementById("hint-text").style.display="none";
  startDay();
}
function restartDay(){
  resetDayState();
  document.getElementById("summary").style.display="none";
  document.querySelectorAll('#order-served-gif img').forEach(img => img.style.display = 'none');
  document.getElementById("game").style.display="block";
  startDay();
}
function restartGame() {
  // Reset everything back to the very start
  day = 1;
  score = 0;
  stars = [];
  ordersServed = 0;
  dayLog = [];
  clearInterval(timerInterval);
  document.getElementById("timer").innerText = "";
  if(mode==="timed") startTimer(); document.getElementById("orders-count").style.display = "block";      document.querySelectorAll('#order-served-gif img').forEach(img => img.style.display = 'none');

  coins = 0;
updateCoins();
 
  
  // Hide all game screens
  document.getElementById("summary").style.display = "none";
  document.getElementById("game").style.display = "none";
  document.getElementById("Sad").style.display = "none";
  document.getElementById("Happy").style.display = "none";
 document.querySelectorAll('#order-served-gif img').forEach(img => img.style.display = 'none');  // Show start screen again
  document.getElementById("start-screen").style.display = "block";
  document.getElementById("difficulty-select").style.display = "none";
  document.getElementById("start-btn").style.display = "inline-block";
  document.getElementById("CipherCafe").style.display="none";
  document.getElementById("Cipher2").style.display="block";

}

function resetDayState(){
  score=0; stars=[]; ordersServed=0; dayLog=[]; clearInterval(timerInterval); document.getElementById("timer").innerText="";
  hintsUsed = 0;
document.getElementById("hint-text").innerText = "";
 document.querySelectorAll('#order-served-gif img').forEach(img => img.style.display = 'none');
}
function updateScore(){ document.getElementById("score").innerText="Score: "+score; }
function updateCoins() {
  document.getElementById("coin-display").innerText = "Coins: " + coins + " 🪙";
}


// --- Start Day ---
function startDay(){
  document.getElementById("day-display").innerText="Day "+day;
  document.getElementById("feedback").innerText="";
  document.getElementById("CipherCafe").style.display="block";
  document.getElementById("Cipher2").style.display="none";
  document.getElementById("stars-left").innerText="Orders left today: "+ORDERS_PER_DAY;
  cipherRules=getCipherRules(day);
  buildMenu();
  generateOrder();
  if(mode==="timed") startTimer();
  updateScore();
}

function giveHint() {
  const hintEl = document.getElementById("hint-text");
  document.getElementById("hint-text").style.display="inline-block";
  if (hintsUsed >= MAX_HINTS_PER_DAY) {
    hintEl.innerText = "No more hints today!";
    return;
  }

  if (coins < 2) {
    hintEl.innerText = "Not enough coins for a hint!";
    return;
  }

  coins -= 2;
  updateCoins();
  hintsUsed++;

  // Choose hint text based on day
  let hintMsg = "";
  if (day === 1) {
    if (hintsUsed === 1) {
    hintMsg = "Hint: C = Chocolate, m = Milk, 2 = Double";
    } else {
    hintMsg = "Hint: I = Iced Coffee, T = Tea, S = Sugar";
    }

  } else if (day === 2) {
    if (hintsUsed === 1) {
    hintMsg = "Hint: '.-' = Coffee, '--' = Matcha, '..-..' = Double";
    } else {
    hintMsg = "Hint: '..' = Iced Coffee, '-..' = Tea, '...' = Sugar";
    }
  } else if (day === 3) {
    if (hintsUsed === 1) {
    hintMsg = "Hint: Δ = Coffee, ♧ = Syrup, Λ = Tea";
    } else {
    hintMsg = "Hint: ⊡ = Chocolate, , || = Double , ◇ = Milk";
    }
  }

  hintEl.innerText = hintMsg + ` (Hint   ${hintsUsed}/${MAX_HINTS_PER_DAY})`;
}


// --- Event Listeners ---
document.getElementById("start-btn").addEventListener("click",()=>{
  document.getElementById("difficulty-select").style.display="block";
  document.getElementById("start-btn").style.display="none";
});
document.getElementById("casual-btn").addEventListener("click",()=>{
  mode="casual";
  ORDERS_PER_DAY=ORDERS_PER_DAY_DEFAULT;
  document.getElementById("stars-left").style.display="block";
  document.getElementById("start-screen").style.display="none";
  document.getElementById("orders-count").style.display="none";
  document.getElementById("timer").style.display="none";
  document.getElementById("game").style.display="block";
  document.getElementById("hint-text").style.display="none";
  document.querySelectorAll('#order-served-gif img').forEach(img => img.style.display = 'none');
  startDay();
});
document.getElementById("timed-btn").addEventListener("click",()=>{
  mode="timed";
  document.querySelectorAll('#order-served-gif img').forEach(img => img.style.display = 'none');
  document.getElementById("timer").style.display="block";
  document.getElementById("stars-left").style.display="none";
  document.getElementById("start-screen").style.display="none";
  document.getElementById("game").style.display="block";
  document.getElementById("hint-text").style.display="none";
  startDay();
});

// Game buttons
document.getElementById("serve-btn").addEventListener("click",serve);
document.getElementById("next-day-btn").addEventListener("click",nextDay);
document.getElementById("restart-btn").addEventListener("click",()=>{ if(day<=3){ restartGame(); }});
document.getElementById("hint-btn").addEventListener("click", giveHint);


// --- Initialize ---
(function init(){})();
