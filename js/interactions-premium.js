/* =====================================================
   CVSTUDIO — BRILLO QUE SIGUE EL CURSOR
===================================================== */

document.addEventListener("DOMContentLoaded", () => {
  const interactiveCards = document.querySelectorAll(
    ".project-card, #proceso .process-item, .section.benefits .benefit-card"
  );

  if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
    return;
  }

  interactiveCards.forEach((card) => {
    card.addEventListener("pointermove", (event) => {
      const rect = card.getBoundingClientRect();

      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      card.style.setProperty("--mouse-x", `${x}px`);
      card.style.setProperty("--mouse-y", `${y}px`);
    });

    card.addEventListener("pointerleave", () => {
      card.style.setProperty("--mouse-x", "50%");
      card.style.setProperty("--mouse-y", "50%");
    });
  });
 
  });/*==================================================
    CONTADORES PREMIUM
==================================================*/

document.addEventListener("DOMContentLoaded", () => {

    const stats = document.querySelectorAll(".stat-number");

    if (!stats.length) return;

    const observer = new IntersectionObserver((entries, obs) => {

        entries.forEach(entry => {

            if (!entry.isIntersecting) return;

            animate(entry.target);

            obs.unobserve(entry.target);

        });

    }, {

        threshold:0.45

    });

    stats.forEach(stat=>observer.observe(stat));

});

function animate(el){

    const final = el.dataset.count;

    if(!final) return;

    if(final==="4-8"){

        let value=0;

        const timer=setInterval(()=>{

            value++;

            el.textContent="0-"+value;

            if(value>=8){

                clearInterval(timer);

                el.textContent="4-8";

            }

        },70);

        return;

    }

    if(final==="1a1"){

        let value=0;

        const timer=setInterval(()=>{

            value++;

            el.textContent=value;

            if(value>=1){

                clearInterval(timer);

                el.textContent="1a1";

            }

        },300);

        return;

    }

    const target=parseInt(final);

    let current=0;

    const increment=Math.ceil(target/45);

    const timer=setInterval(()=>{

        current+=increment;

        if(current>=target){

            current=target;

            clearInterval(timer);

        }

        el.textContent=current+(final==="100"?"%":"");

    },25);

}/*==================================================
    CONTADORES PREMIUM
==================================================*/

document.addEventListener("DOMContentLoaded", () => {

    const counters = document.querySelectorAll(".stat-number");

    if (!counters.length) return;

    const observer = new IntersectionObserver((entries, obs) => {

        entries.forEach(entry => {

            if (!entry.isIntersecting) return;

            animateCounter(entry.target);

            obs.unobserve(entry.target);

        });

    }, {
        threshold: 0.45
    });

    counters.forEach(counter => observer.observe(counter));

});

function animateCounter(el) {

    const type = el.dataset.count;

    if (type === "4-8") {

        let n = 0;

        const timer = setInterval(() => {

            n++;

            el.textContent = "0–" + n;

            if (n >= 8) {

                clearInterval(timer);

                el.textContent = "4–8";

            }

        }, 70);

        return;

    }

    const target = parseInt(type);

    let value = 0;

    const increment = Math.max(1, Math.ceil(target / 40));

    const timer = setInterval(() => {

        value += increment;

        if (value >= target) {

            value = target;

            clearInterval(timer);

        }

        if (type === "100") {

            el.textContent = value + "%";

        } else if (type === "6") {

            el.textContent = value + "+";

        } else if (type === "1") {

            el.textContent = "1 a 1";

        } else {

            el.textContent = value;

        }

    }, 28);

}