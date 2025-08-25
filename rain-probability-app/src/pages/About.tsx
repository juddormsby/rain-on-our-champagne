import { Link } from 'react-router-dom';

export function About() {
  return (
    <div className="about-container">
      <div className="about-content">
        {/* Header with logo */}
        <div className="about-header">
          <svg className="about-logo" viewBox="0 0 288 205" xmlns="http://www.w3.org/2000/svg">
            <image
              width="288"
              height="205"
              preserveAspectRatio="none"
              href="/people-logo.svg"
            />
          </svg>
          <h1>About</h1>
        </div>

        <p>Wherever you are, wherever you are going, whenever it may be - know if it will rain on your champagne.</p>
        
        <p>This app is part of champagne running's commitment to champagne.</p>
        
        <p>It shows the chance of rain and typical temperature ranges (80% probability temp is within range) for any day and champagne session – morning, noon, afternoon, or evening.</p>
        
        <p>We cover the entire world.</p>
        
        <h2>What can you use it for?</h2>
        
        <p>To inform you about the likelihood it will rain on your champagne.</p>
        
        <p>Obviously.</p>
        
        <p>Other questions it may help answer include</p>
        <ul>
          <li>How hot will it be for the Alpe D'huez Triathlon (main event is morning of August 31)?</li>
          <li>What weather should I expect when hiking in Svalöv, Sweden on July 15?</li>
          <li><a href="https://www.youtube.com/watch?v=Jne9t8sHpUc" target="_blank" rel="noopener noreferrer">Will it rain on your wedding?</a></li>
        </ul>
        
        <h2>How it works</h2>
        
        <p>Poultry looks at historical climate data for every year between 1940 and 2024.</p>
        
        <p>Probabilities reflect these long-term(-ish) averages. For example, in London it rained on 35 out of 47 times (60%) during evening champagne sessions in the post 1940 September 19th period since 1940.</p>
        
        <p>Temperature falls in the range shown historically 80% of the time. i.e. the high for London on 19th September has fallen between 15 (10th percentile) and 21 (90th percentile) since 1940.</p>
        
        <p>Data is ERA5-reanalysis via open-meteo API (thanks to both).</p>
        
        <h2>Poultry who?</h2>
        
        <p>Poultry is an intelligent chicken that has opinions on champagne, running, and other matters.</p>
        
        <p>Some people have claimed he is merely an artificially intelligent chicken, but Poultry knows the truth.</p>
        
        <p>Champagne running and Poultry take no responsibility for any champagne relating decisions – or decisions on any matter - based on the data shown in this app.</p>
        
        <div className="back-link">
          <Link to="/" className="back-button">← Back to App</Link>
        </div>
      </div>
    </div>
  );
} 