<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>NAPPS Ogun | Official State Portal</title>
    
    <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600;700&family=Montserrat:wght@300;400;600;700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">

    <style>
        :root { 
            --primary: #051a13; 
            --accent: #c5a028; 
            --bg: #fdfdfb;
            --white: #ffffff;
            --glass: rgba(255, 255, 255, 0.95);
        }

        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Montserrat', sans-serif; background: var(--bg); color: var(--primary); line-height: 1.6; overflow-x: hidden; }

        /* NAVIGATION */
        nav {
            background: var(--glass); padding: 15px 5%; display: flex; justify-content: space-between; align-items: center;
            position: sticky; top: 0; z-index: 1000; box-shadow: 0 2px 20px rgba(0,0,0,0.08); backdrop-filter: blur(15px);
        }
        .logo-area { display: flex; align-items: center; gap: 10px; text-decoration: none; color: var(--primary); }
        .logo-area img { height: 50px; }
        .logo-area h1 { font-family: 'Cormorant Garamond'; font-size: 1.6rem; line-height: 1; }
        .nav-links { display: flex; gap: 20px; list-style: none; align-items: center; }
        .nav-links a { text-decoration: none; color: var(--primary); font-size: 0.85rem; font-weight: 700; transition: 0.3s; text-transform: uppercase; }
        .nav-links a:hover { color: var(--accent); }
        .btn-portal { background: var(--primary); color: var(--accent) !important; padding: 12px 24px; border-radius: 50px; letter-spacing: 1px; }
        .mobile-toggle { display: none; font-size: 1.5rem; cursor: pointer; color: var(--primary); }

        /* HERO SECTION */
        .hero {
            padding: 120px 5% 80px; text-align: center; position: relative;
            background: linear-gradient(135deg, rgba(5, 26, 19, 0.9), rgba(5, 26, 19, 0.95)), url('https://via.placeholder.com/1920x1080/051a13/c5a028') center/cover;
            color: var(--white);
        }
        .hero h2 { font-family: 'Cormorant Garamond'; font-size: 4rem; margin-bottom: 20px; color: var(--accent); }
        .hero p { max-width: 700px; margin: 0 auto 40px; font-size: 1.1rem; opacity: 0.9; }
        .btn-main { background: var(--accent); color: var(--primary); padding: 15px 35px; border-radius: 50px; text-decoration: none; font-weight: 800; transition: 0.3s; display: inline-block; }
        .btn-main:hover { transform: translateY(-3px); box-shadow: 0 10px 20px rgba(197, 160, 40, 0.3); }

        /* SECTIONS GENERAL */
        section { padding: 80px 5%; }
        .section-title { text-align: center; margin-bottom: 50px; }
        .section-title h3 { font-family: 'Cormorant Garamond'; font-size: 2.8rem; color: var(--primary); }
        .section-title div { width: 80px; height: 3px; background: var(--accent); margin: 15px auto; }

        /* ABOUT NAPPS */
        .about-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 50px; align-items: center; }
        .about-text h4 { font-size: 1.5rem; color: var(--accent); margin-bottom: 15px; font-family: 'Cormorant Garamond'; }
        .about-text p { margin-bottom: 20px; color: #555; }
        .about-img img { width: 100%; border-radius: 20px; box-shadow: 0 20px 40px rgba(0,0,0,0.1); }

        /* EXECUTIVES CARDS */
        .exec-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 30px; }
        .exec-card { background: var(--white); border-radius: 20px; text-align: center; padding: 30px 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.05); transition: 0.4s; border-bottom: 4px solid transparent; }
        .exec-card:hover { transform: translateY(-10px); border-color: var(--accent); }
        .exec-img { width: 120px; height: 120px; border-radius: 50%; object-fit: cover; margin: 0 auto 20px; border: 3px solid var(--accent); padding: 3px; }
        .exec-card h5 { font-family: 'Cormorant Garamond'; font-size: 1.5rem; margin-bottom: 5px; }
        .exec-card p { font-size: 0.8rem; font-weight: 700; color: var(--accent); text-transform: uppercase; letter-spacing: 1px; }

        /* LIVE DIRECTORY & SCROLLER LAYOUT */
        .directory-layout { display: grid; grid-template-columns: 1fr 3fr; gap: 40px; }
        
        /* VERTICAL SCROLLER */
        .live-panel { background: var(--primary); color: var(--white); border-radius: 20px; padding: 30px 20px; height: 600px; display: flex; flex-direction: column; box-shadow: 0 20px 40px rgba(5, 26, 19, 0.2); }
        .live-panel h4 { text-align: center; font-family: 'Cormorant Garamond'; font-size: 1.8rem; color: var(--accent); border-bottom: 1px solid rgba(197, 160, 40, 0.3); padding-bottom: 15px; margin-bottom: 20px; }
        .scroller-container { flex-grow: 1; overflow: hidden; position: relative; }
        .scroller-content { animation: scrollUp 25s linear infinite; }
        .scroller-container:hover .scroller-content { animation-play-state: paused; }
        
        @keyframes scrollUp { 0% { transform: translateY(100%); } 100% { transform: translateY(-100%); } }

        .feed-item { background: rgba(255,255,255,0.05); padding: 15px; border-radius: 12px; margin-bottom: 15px; border-left: 3px solid var(--accent); }
        .feed-item.bank { background: linear-gradient(135deg, rgba(197, 160, 40, 0.1), rgba(197, 160, 40, 0.2)); border-left: 3px solid #fff; }
        .feed-item h6 { font-size: 0.9rem; margin-bottom: 5px; color: var(--accent); }
        .feed-item p { font-size: 0.8rem; opacity: 0.9; }

        /* DIRECTORY GRID */
        .schools-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 25px; align-content: start; }
        .school-card { background: white; border-radius: 15px; overflow: hidden; box-shadow: 0 5px 20px rgba(0,0,0,0.05); transition: 0.3s; position: relative; border: 1px solid #eee; }
        .school-card:hover { transform: translateY(-5px); box-shadow: 0 15px 30px rgba(0,0,0,0.1); }
        .school-img { height: 160px; background: #f4f4f4; }
        .school-img img { width: 100%; height: 100%; object-fit: cover; }
        .school-body { padding: 20px; }
        .verified-badge { position: absolute; top: 10px; right: 10px; background: var(--accent); color: var(--primary); padding: 4px 10px; border-radius: 50px; font-size: 0.65rem; font-weight: 800; box-shadow: 0 5px 10px rgba(0,0,0,0.2); }

        /* UNIFIED EXAM BANNER */
        .exam-banner { background: var(--accent); color: var(--primary); padding: 50px; border-radius: 30px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 30px; box-shadow: 0 20px 40px rgba(197, 160, 40, 0.2); }
        .exam-info h4 { font-family: 'Cormorant Garamond'; font-size: 2.5rem; margin-bottom: 10px; }
        .btn-dark { background: var(--primary); color: var(--accent); padding: 15px 35px; border-radius: 12px; text-decoration: none; font-weight: 800; }

        /* GALLERY SECTION */
        .gallery-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 15px; }
        .gallery-item { height: 220px; border-radius: 15px; overflow: hidden; cursor: pointer; position: relative; }
        .gallery-item img { width: 100%; height: 100%; object-fit: cover; transition: 0.5s; }
        .gallery-item::after { content: '\f00e'; font-family: 'Font Awesome 5 Free'; font-weight: 900; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: white; font-size: 2rem; opacity: 0; transition: 0.3s; }
        .gallery-item:hover img { transform: scale(1.1); filter: brightness(0.6); }
        .gallery-item:hover::after { opacity: 1; }

        /* MOBILE RESPONSIVENESS */
        @media (max-width: 992px) {
            .directory-layout { grid-template-columns: 1fr; }
            .live-panel { height: 400px; }
            .about-grid { grid-template-columns: 1fr; }
        }
        @media (max-width: 768px) {
            .nav-links { display: none; flex-direction: column; position: absolute; top: 80px; left: 0; width: 100%; background: var(--white); padding: 20px; box-shadow: 0 10px 20px rgba(0,0,0,0.1); }
            .nav-links.active { display: flex; }
            .mobile-toggle { display: block; }
            .hero h2 { font-size: 2.8rem; }
            .exam-banner { text-align: center; justify-content: center; }
        }
    </style>
</head>
<body>

    <nav>
        <a href="index.html" class="logo-area">
            <img src="https://via.placeholder.com/80x80/051a13/c5a028?text=N" alt="NAPPS Logo">
            <div>
                <h1>NAPPS</h1>
                <small style="font-weight: 800; color: var(--accent); letter-spacing: 1px;">OGUN STATE</small>
            </div>
        </a>
        <i class="fas fa-bars mobile-toggle" id="menuToggle"></i>
        <ul class="nav-links" id="navLinks">
            <li><a href="#about">About</a></li>
            <li><a href="#executives">Executives</a></li>
            <li><a href="#exams">Unified Exams</a></li>
            <li><a href="#directory">Directory</a></li>
            <li><a href="#gallery">Gallery</a></li>
            <li><a href="register.html">Register</a></li>
            <li><a href="login.html" class="btn-portal">Member Login <i class="fas fa-sign-in-alt"></i></a></li>
        </ul>
    </nav>

    <header class="hero">
        <h2>Excellence in Private Education</h2>
        <p>The official regulatory, support, and administrative portal for the National Association of Proprietors of Private Schools (NAPPS), Ogun State Chapter.</p>
        <div style="display: flex; justify-content: center; gap: 15px; flex-wrap: wrap;">
            <a href="register.html" class="btn-main">Enroll Institution</a>
            <a href="#directory" class="btn-main" style="background: transparent; border: 2px solid var(--accent); color: var(--accent);">Verify a School</a>
        </div>
    </header>

    <section id="about">
        <div class="section-title">
            <h3>Who We Are</h3>
            <div></div>
        </div>
        <div class="about-grid">
            <div class="about-img">
                <img src="https://via.placeholder.com/600x400/051a13/c5a028?text=NAPPS+Congress" alt="NAPPS Meeting">
            </div>
            <div class="about-text">
                <h4>Empowering Educational Proprietors</h4>
                <p>NAPPS Ogun State Chapter is the apex body coordinating, supporting, and regulating the activities of private school owners across the state. We are committed to fostering academic excellence, high moral standards, and continuous professional development.</p>
                <p>Through our unified networks, standard examination portals, and cooperative frameworks, we ensure that every registered institution operates at the peak of administrative and educational efficiency.</p>
            </div>
        </div>
    </section>

    <section id="executives" style="background: #f4f1ea;">
        <div class="section-title">
            <h3>State Executives</h3>
            <div></div>
            <p>Meet the visionary leaders steering the affairs of the Ogun State Chapter.</p>
        </div>
        <div class="exec-grid">
            <div class="exec-card">
                <img src="https://via.placeholder.com/150" alt="President" class="exec-img">
                <h5>Dr. Adebayo O.</h5>
                <p>State Chairman</p>
            </div>
            <div class="exec-card">
                <img src="https://via.placeholder.com/150" alt="Secretary" class="exec-img">
                <h5>Mrs. Olufunke T.</h5>
                <p>State Secretary</p>
            </div>
            <div class="exec-card">
                <img src="https://via.placeholder.com/150" alt="Treasurer" class="exec-img">
                <h5>Mr. Samuel K.</h5>
                <p>Financial Secretary</p>
            </div>
            <div class="exec-card">
                <img src="https://via.placeholder.com/150" alt="PRO" class="exec-img">
                <h5>Chief (Mrs) Bola A.</h5>
                <p>Public Relations Officer</p>
            </div>
        </div>
    </section>

    <section id="exams">
        <div class="exam-banner">
            <div class="exam-info">
                <h4>Unified Termly Exams</h4>
                <p>Access standardized examinations, CBT practice portals, and instant result verification for all accredited member schools in Ogun State.</p>
            </div>
            <a href="#" class="btn-dark">ACCESS CBT PORTAL <i class="fas fa-laptop-code" style="margin-left: 10px;"></i></a>
        </div>
    </section>

    <section id="directory" style="background: var(--white);">
        <div class="section-title">
            <h3>Verified Institutions & Live Feed</h3>
            <div></div>
            <p>Real-time updates and our gold-standard registry of accredited private schools.</p>
        </div>
        
        <div class="directory-layout">
            <div class="live-panel">
                <h4><i class="fas fa-broadcast-tower"></i> Live Feed</h4>
                <div class="scroller-container">
                    <div class="scroller-content" id="liveScroller">
                        <div class="feed-item bank">
                            <h6><i class="fas fa-university"></i> OFFICIAL BANKING</h6>
                            <p><b>Eco Bank</b><br>Acc: 0990147139<br>NAPPS Ogun State Chapter</p>
                        </div>
                        <div class="feed-item bank">
                            <h6><i class="fas fa-info-circle"></i> 2026 DUES</h6>
                            <p>Annual registration and verification fee is currently set at <b>₦5,000.00</b>.</p>
                        </div>
                        <div class="feed-item">
                            <h6><i class="fas fa-bell"></i> SYSTEM UPDATE</h6>
                            <p>Listening for new institutional registrations...</p>
                        </div>
                    </div>
                </div>
            </div>

            <div class="schools-grid" id="schoolGrid">
                <p style="grid-column: 1/-1; text-align: center; color: #888;">Synchronizing State Registry...</p>
            </div>
        </div>
    </section>

    <section id="gallery" style="background: #f4f1ea;">
        <div class="section-title">
            <h3>NAPPS Memories</h3>
            <div></div>
            <p>Live highlights from our state congresses, seminars, and member uploads.</p>
        </div>
        <div class="gallery-grid" id="galleryGrid">
            </div>
    </section>

    <footer style="background: var(--primary); color: white; padding: 60px 5% 30px; text-align: center;">
        <img src="https://via.placeholder.com/80x80/051a13/c5a028?text=N" alt="Logo" style="height: 60px; margin-bottom: 20px;">
        <h3 style="font-family: 'Cormorant Garamond'; font-size: 2rem; color: var(--accent);">NAPPS Ogun State Chapter</h3>
        <p style="font-size: 0.9rem; opacity: 0.7; margin: 15px 0 30px;">Fostering qualitative education and unified administrative excellence.</p>
        <p style="font-size: 0.8rem; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 20px; opacity: 0.5;">
            &copy; 2026 NAPPS Ogun. All Rights Reserved. Built for Educational Excellence.
        </p>
    </footer>

    <script>
        // Toggle Mobile Menu
        const menuToggle = document.getElementById('menuToggle');
        const navLinks = document.getElementById('navLinks');
        menuToggle.onclick = () => navLinks.classList.toggle('active');

        // Initialize Fetching
        window.onload = async () => {
            fetchSchools();
            fetchGallery();
        };

        // Fetch Schools & Populate both the Grid and the Live Feed
        async function fetchSchools() {
            try {
                // Point this to your backend api route
                const res = await fetch('/.netlify/functions/api?type=schools');
                const data = await res.json();
                
                const grid = document.getElementById('schoolGrid');
                const scroller = document.getElementById('liveScroller');
                grid.innerHTML = '';

                // If no data, show placeholder
                if(data.length === 0) {
                    grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center;">No schools registered yet.</p>';
                    return;
                }

                // Reverse data to show newest first
                const reversedData = data.reverse();

                reversedData.forEach((school, index) => {
                    // 1. Populate the Main Grid
                    const card = document.createElement('div');
                    card.className = 'school-card';
                    card.innerHTML = `
                        ${school.status === 'verified' ? '<div class="verified-badge"><i class="fas fa-check-circle"></i> VERIFIED</div>' : ''}
                        <div class="school-img">
                            <img src="${school.image_url || 'https://via.placeholder.com/300x200'}" alt="${school.name}">
                        </div>
                        <div class="school-body">
                            <h4 style="font-family: 'Cormorant Garamond'; font-size: 1.3rem; margin-bottom: 5px;">${school.name}</h4>
                            <p style="font-size: 0.75rem; font-weight: 700; color: var(--accent); text-transform: uppercase;">
                                <i class="fas fa-map-marker-alt"></i> ${school.location}
                            </p>
                        </div>
                    `;
                    grid.appendChild(card);

                    // 2. Populate the Live Scrolling Feed (Only top 5 recent schools to avoid clutter)
                    if(index < 5) {
                        const feedItem = document.createElement('div');
                        feedItem.className = 'feed-item';
                        feedItem.innerHTML = `
                            <h6><i class="fas fa-school"></i> NEW REGISTRATION</h6>
                            <p><b>${school.name}</b> from ${school.location} just joined the portal!</p>
                        `;
                        scroller.appendChild(feedItem);
                    }
                });
            } catch (err) {
                console.error("Error fetching schools:", err);
            }
        }

        // Fetch Gallery
        async function fetchGallery() {
            try {
                const res = await fetch('/.netlify/functions/api?type=uploads'); 
                const data = await res.json();
                const grid = document.getElementById('galleryGrid');
                grid.innerHTML = '';

                data.slice(0, 8).forEach(item => {
                    const div = document.createElement('div');
                    div.className = 'gallery-item';
                    div.innerHTML = `<img src="${item.image_url}" alt="Event Image">`;
                    grid.appendChild(div);
                });
            } catch (err) {
                console.log("Gallery empty or fetch error.");
            }
        }
    </script>
</body>
</html>