import { useEffect, useMemo, useState } from 'react';
import './App.css';
import { Navigation } from './components/Navigation';
import { LearningMap } from './components/LearningMap';
import { LessonWorkspace } from './components/LessonWorkspace';
import { lessonLevels, allLessons, findLessonById } from './data/lessons';
import { getStoredProgress, saveProgress } from './utils/storage';
import { calculateLevelFromXp, getLevelProgress } from './utils/xp';

const achievementDefinitions = [
  {
    id: 'first-code',
    title: '🎯 First Code',
    description: 'Run your first JavaScript program.',
    check: (progress) => progress.completedLessons.length > 0 || Object.keys(progress.challengeResults || {}).length > 0,
  },
  {
    id: 'first-challenge',
    title: '🔥 First Challenge',
    description: 'Complete your first challenge.',
    check: (progress) => Object.keys(progress.challengeResults || {}).length > 0,
  },
  {
    id: 'speed-coder',
    title: '⚡ Speed Coder',
    description: 'Complete a challenge quickly.',
    check: (progress) => progress.completedLessons.length >= 2,
  },
  {
    id: 'perfect-lesson',
    title: '🏆 Perfect Lesson',
    description: 'Complete a lesson with strong performance.',
    check: (progress) => Object.values(progress.stars || {}).some((stars) => stars >= 3),
  },
  {
    id: 'five-lessons',
    title: '📚 5 Lessons',
    description: 'Complete five lessons.',
    check: (progress) => progress.completedLessons.length >= 5,
  },
  {
    id: 'explorer',
    title: '🚀 JavaScript Explorer',
    description: 'Complete the JavaScript basics path.',
    check: (progress) => progress.completedLessons.length >= 8,
  },
];

function App() {
  const [page, setPage] = useState('landing');
  const [progress, setProgress] = useState(() => getStoredProgress());
  const [currentLessonId, setCurrentLessonId] = useState(allLessons[0]?.id || '');
  const [xpToast, setXpToast] = useState('');

  useEffect(() => {
    saveProgress(progress);
    document.body.dataset.theme = progress.settings.theme;
  }, [progress]);

  useEffect(() => {
    if (!xpToast) return undefined;
    const timer = window.setTimeout(() => setXpToast(''), 1200);
    return () => window.clearTimeout(timer);
  }, [xpToast]);

  const levelInfo = useMemo(() => calculateLevelFromXp(progress.xp), [progress.xp]);
  const levelProgress = useMemo(() => getLevelProgress(progress.xp), [progress.xp]);
  const currentLesson = useMemo(() => findLessonById(currentLessonId), [currentLessonId]);
  const completedLessonsCount = progress.completedLessons.length;
  const completionRate = Math.round((completedLessonsCount / allLessons.length) * 100);

  const achievements = useMemo(
    () =>
      achievementDefinitions.map((achievement) => ({
        ...achievement,
        unlocked: achievement.check(progress),
      })),
    [progress],
  );

  const nextLevelXp = Math.max(0, levelProgress.next - progress.xp);

  const handleNavigate = (nextPage) => {
    setPage(nextPage);
  };

  const handleThemeToggle = () => {
    setProgress((previous) => ({
      ...previous,
      settings: {
        ...previous.settings,
        theme: previous.settings.theme === 'dark' ? 'light' : 'dark',
      },
    }));
  };

  const handleSelectLesson = (id) => {
    setCurrentLessonId(id);
    setPage('lesson');
  };

  const handleLessonComplete = (lessonId, earnedXp) => {
    setProgress((previous) => {
      const completedLessons = new Set(previous.completedLessons);
      completedLessons.add(lessonId);

      const nextStars = {
        ...(previous.stars || {}),
        [lessonId]: Math.max(previous.stars?.[lessonId] || 0, 3),
      };

      const challengeResults = {
        ...(previous.challengeResults || {}),
        [lessonId]: true,
      };

      const nextProgress = {
        ...previous,
        xp: previous.xp + earnedXp,
        completedLessons: [...completedLessons],
        stars: nextStars,
        challengeResults,
      };

      const todayKey = new Date().toDateString();
      const currentStreak = previous.lastActiveDate === todayKey ? previous.streak : previous.streak + 1;
      nextProgress.streak = currentStreak;
      nextProgress.lastActiveDate = todayKey;

      const unlockIds = achievementDefinitions
        .filter((achievement) => achievement.check(nextProgress))
        .map((achievement) => achievement.id);

      nextProgress.achievements = Array.from(new Set([...previous.achievements, ...unlockIds]));
      return nextProgress;
    });

    setXpToast(`+${earnedXp} XP ✨`);
  };

  const goToNextLesson = () => {
    const currentIndex = allLessons.findIndex((lesson) => lesson.id === currentLessonId);
    const nextLesson = allLessons[currentIndex + 1] || allLessons[0];
    setCurrentLessonId(nextLesson.id);
    setPage('lesson');
  };

  const renderLanding = () => (
    <div className="landing-shell">
      <header className="landing-header">
        <div className="brand">
          <span className="brand-mark">CQ</span>
          <span>CodeQuest JS</span>
        </div>
        <div className="nav-inline">
          <button type="button" onClick={() => setPage('dashboard')}>Start Learning</button>
          <button type="button" className="secondary" onClick={() => setPage('learn')}>Explore Levels</button>
        </div>
      </header>

      <main className="landing-main">
        <section className="hero-panel">
          <div className="hero-copy">
            <p className="eyebrow">Learn JavaScript by playing</p>
            <h1>Learn JavaScript by playing.</h1>
            <p className="subhead">Write code. See what happens. Complete challenges. Level up.</p>
            <div className="cta-row">
              <button type="button" className="primary" onClick={() => setPage('dashboard')}>Start Learning</button>
              <button type="button" className="secondary" onClick={() => setPage('learn')}>Explore Levels</button>
            </div>
          </div>

          <div className="hero-preview card">
            <div className="preview-top">
              <span className="dot red" />
              <span className="dot yellow" />
              <span className="dot green" />
            </div>
            <div className="preview-code">
              <div>const name = "Anshu";</div>
              <div>console.log(`Hello ${name}!`);</div>
              <div className="preview-output">Hello Anshu!</div>
            </div>
          </div>
        </section>

        <section className="feature-grid">
          {[
            ['Learn visually', 'See code explained with simple examples and friendly visuals.'],
            ['Code instantly', 'Write JavaScript and run it without leaving the lesson.'],
            ['Practice through challenges', 'Solve short problems and earn rewards for each win.'],
            ['Earn XP', 'Collect XP, unlock levels, and keep building momentum.'],
            ['Unlock new levels', 'Every win opens the next step in your JavaScript path.'],
            ['Build real projects', 'Use your skills to make small interactive apps.'],
          ].map(([title, description]) => (
            <article key={title} className="feature-card card">
              <h3>{title}</h3>
              <p>{description}</p>
            </article>
          ))}
        </section>
      </main>
    </div>
  );

  const renderDashboard = () => (
    <div className="page-shell">
      <div className="dashboard-grid">
        <section className="card hero-metric">
          <p className="eyebrow">Current level</p>
          <h2>Level {levelInfo.level}</h2>
          <p>{levelInfo.title}</p>
          <div className="xp-block">
            <div>
              <small>XP</small>
              <strong>{progress.xp} / {levelProgress.next}</strong>
            </div>
            <div className="progress-bar">
              <span style={{ width: `${levelProgress.progress}%` }} />
            </div>
          </div>
        </section>

        <section className="card stat-card">
          <p className="eyebrow">Current streak</p>
          <h3>🔥 {progress.streak} day streak</h3>
        </section>

        <section className="card stat-card">
          <p className="eyebrow">Completed lessons</p>
          <h3>{completedLessonsCount} / {allLessons.length}</h3>
        </section>

        <section className="card stat-card">
          <p className="eyebrow">Achievements</p>
          <h3>{achievements.filter((item) => item.unlocked).length}</h3>
        </section>
      </div>

      <div className="card dashboard-cta">
        <div>
          <p className="eyebrow">Keep going</p>
          <h2>Continue learning</h2>
        </div>
        <button type="button" className="primary" onClick={() => setPage('lesson')}>
          Continue Learning →
        </button>
      </div>

      <LearningMap
        levels={lessonLevels}
        completedLessonIds={progress.completedLessons}
        currentLessonId={currentLessonId}
        onSelectLesson={handleSelectLesson}
        currentLevel={currentLesson.levelId}
      />
    </div>
  );

  const renderLearn = () => (
    <div className="page-shell">
      <LearningMap
        levels={lessonLevels}
        completedLessonIds={progress.completedLessons}
        currentLessonId={currentLessonId}
        onSelectLesson={handleSelectLesson}
        currentLevel={currentLesson.levelId}
      />
    </div>
  );

  const renderAchievements = () => (
    <div className="page-shell">
      <div className="section-head">
        <div>
          <p className="eyebrow">Your rewards</p>
          <h2>Achievements</h2>
        </div>
      </div>

      <div className="achievement-grid">
        {achievements.map((item) => (
          <article key={item.id} className={`card achievement-card ${item.unlocked ? 'unlocked' : ''}`}>
            <div className="achievement-icon">{item.title.split(' ')[0]}</div>
            <div>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </div>
            <span>{item.unlocked ? 'Unlocked' : 'Locked'}</span>
          </article>
        ))}
      </div>
    </div>
  );

  const renderProfile = () => (
    <div className="page-shell">
      <div className="profile-grid">
        <section className="card profile-card">
          <p className="eyebrow">Profile</p>
          <h2>JavaScript Explorer</h2>
          <p>Level {levelInfo.level}</p>
          <div className="profile-metrics">
            <span>XP: {progress.xp}</span>
            <span>Streak: 🔥 {progress.streak}</span>
            <span>Lessons: {completedLessonsCount}</span>
          </div>
        </section>

        <section className="card profile-card">
          <p className="eyebrow">Stars</p>
          <h2>{Object.values(progress.stars || {}).reduce((sum, count) => sum + count, 0)} stars</h2>
          <p>Keep pushing toward the next challenge.</p>
        </section>
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="page-shell">
      <section className="card settings-card">
        <p className="eyebrow">Settings</p>
        <h2>Theme</h2>
        <button type="button" className="secondary" onClick={handleThemeToggle}>
          {progress.settings.theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        </button>
      </section>
    </div>
  );

  const renderLesson = () => (
    <div className="page-shell">
      <LessonWorkspace
        lesson={currentLesson}
        onCompleteLesson={handleLessonComplete}
        goNext={goToNextLesson}
        theme={progress.settings.theme}
      />
    </div>
  );

  return (
    <div className="app-shell">
      {page !== 'landing' && (
        <Navigation page={page} onNavigate={handleNavigate} onToggleTheme={handleThemeToggle} theme={progress.settings.theme} />
      )}

      {xpToast && <div className="xp-toast">{xpToast}</div>}

      {page === 'landing' && renderLanding()}
      {page === 'dashboard' && renderDashboard()}
      {page === 'learn' && renderLearn()}
      {page === 'lesson' && renderLesson()}
      {page === 'achievements' && renderAchievements()}
      {page === 'profile' && renderProfile()}
      {page === 'settings' && renderSettings()}
    </div>
  );
}

export default App;
