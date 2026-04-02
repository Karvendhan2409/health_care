# Contributing Guidelines

Thank you for your interest in contributing to the Smart Health Risk Predictor project! This document outlines how to contribute effectively.

---

## Code of Conduct

We are committed to providing a welcoming and inclusive environment for all contributors. Please be respectful, professional, and constructive in all interactions.

---

## How to Contribute

### 1. Reporting Bugs

**Before submitting a bug report:**
- Check if the bug has already been reported in Issues
- Test with the latest version from main branch
- Provide clear, reproducible steps

**Bug Report Template:**
```markdown
### Description
Brief description of the bug

### Steps to Reproduce
1. Step 1
2. Step 2
3. ...

### Expected Behavior
What should happen

### Actual Behavior
What actually happens

### Environment
- Browser: Chrome/Firefox/Safari/Edge
- OS: Windows/macOS/Linux
- Node.js Version: 14/16/18
```

### 2. Suggesting Features

**Feature Request Template:**
```markdown
### Description
Clear description of the feature

### Problem It Solves
Why this feature is needed

### Proposed Solution
How should it work

### Examples
Real-world use cases
```

### 3. Submitting Code Changes

#### Setup Development Environment
```bash
# Clone the repository
git clone https://github.com/Karvendhan2409/health_care_checker.git
cd health-risk-predictor

# Install dependencies
cd backend
npm install
cd ..

# Create a feature branch
git checkout -b feature/your-feature-name
```

#### Code Style Guidelines

**JavaScript**
```javascript
// Use camelCase for variables and functions
const patientName = 'John Doe';
function calculateHealthScore() { }

// Use meaningful names
const riskScore = 5;  // Good
const rs = 5;         // Bad

// Add comments for complex logic
// Calculate health index considering age penalty
let score = 100;
if (assessment.age > 60) score -= 15;

// Use const by default, let when reassignment needed
const maxAssessments = 50;
let currentIndex = 0;

// Arrow functions for callbacks
array.forEach(item => console.log(item));

// Template literals for strings
const message = `Patient ${name} has ${score} risk score`;
```

**HTML**
```html
<!-- Use semantic HTML -->
<form id="healthForm">
  <input id="patientName" type="text" placeholder="Name" />
</form>

<!-- Avoid inline styles (use CSS classes) -->
<div class="risk-card high">...</div>

<!-- Proper indentation (2 spaces) -->
<div class="container">
  <h1>Title</h1>
</div>
```

**CSS**
```css
/* Use CSS variables for colors */
:root {
  --primary-color: #2ecc71;
  --secondary-color: #3498db;
}

/* BEM naming convention */
.stat-card { }
.stat-card__label { }
.stat-card--active { }

/* Group related properties */
.button {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  background-color: var(--primary-color);
}
```

#### Commit Message Guidelines

```
Format: <type>(<scope>): <subject>

type: feat, fix, docs, style, refactor, test, chore
scope: frontend, backend, api, docs
subject: 50 characters max, lowercase, no period

Examples:
feat(frontend): add dark mode toggle
fix(backend): handle missing age parameter
docs(readme): update installation steps
refactor(api): simplify risk calculation
```

#### Pull Request Process

1. **Create a Feature Branch**
   ```bash
   git checkout -b feature/add-export-excel
   ```

2. **Make Your Changes**
   - Keep commits atomic and focused
   - Write clear commit messages
   - Update relevant documentation

3. **Test Your Changes**
   ```bash
   # Start backend
   cd backend && npm start
   
   # Test in browser
   # http://localhost:5000
   ```

4. **Push to Your Fork**
   ```bash
   git push origin feature/add-export-excel
   ```

5. **Open a Pull Request**
   - Link related issues
   - Describe changes clearly
   - Include screenshots if UI changes

**PR Template:**
```markdown
## Description
Brief description of changes

## Related Issue
Fixes #123

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update

## Changes Made
- Change 1
- Change 2

## Testing Done
Describe how you tested

## Screenshots (if applicable)

## Checklist
- [ ] Code follows style guidelines
- [ ] Comments added for complex logic
- [ ] Documentation updated
- [ ] Tested in multiple browsers
```

---

## Project Structure for Contributors

```
health-risk-predictor/
├── frontend/
│   ├── index.html      ← HTML structure
│   ├── script.js       ← JavaScript logic (950+ lines)
│   └── style.css       ← Styling & responsiveness
├── backend/
│   ├── server.js       ← Express server
│   ├── routes/         ← API routes
│   ├── controllers/    ← Business logic
│   └── utils/          ← Helper functions
├── README.md           ← Project overview
├── ARCHITECTURE.md     ← Technical details (you're reading it!)
└── .gitignore          ← Git ignore rules

Contribution Areas:
- frontend/script.js: Most active area (features, fixes)
- backend/utils/: Algorithm improvements
- frontend/style.css: UI/UX enhancements
- README.md: Documentation improvements
```

---

## Areas Seeking Contributions

### High Priority
- [ ] Add user authentication system
- [ ] Integrate database (MongoDB/PostgreSQL)
- [ ] Create REST API for history endpoints
- [ ] Add unit tests
- [ ] Optimize chart rendering

### Medium Priority
- [ ] Mobile app (React Native)
- [ ] Email notification system
- [ ] Advanced analytics dashboard
- [ ] Data export improvements
- [ ] Performance optimization

### Nice-to-Have
- [ ] Machine learning integration
- [ ] Multi-language support
- [ ] Accessibility improvements (WCAG 2.1)
- [ ] Dark mode refinements
- [ ] Documentation translations

---

## Development Workflow

### 1. Feature Development
```bash
# Create feature branch
git checkout -b feature/new-feature

# Make changes and commit
git add .
git commit -m "feat(scope): description"

# Push and create PR
git push origin feature/new-feature
```

### 2. Bug Fixing
```bash
# Create bug fix branch
git checkout -b fix/bug-name

# Make fixes and commit
git add .
git commit -m "fix(scope): description"

# Push and create PR
git push origin fix/bug-name
```

### 3. Documentation
```bash
# Create docs branch
git checkout -b docs/update-guide

# Update documentation
git add .
git commit -m "docs(file): update content"

# Push and create PR
git push origin docs/update-guide
```

---

## Testing Before Submission

### Frontend Testing
- [ ] Test in Chrome, Firefox, Safari, Edge
- [ ] Test on mobile (responsive design)
- [ ] Verify dark mode works
- [ ] Check form validation
- [ ] Test all tabs and features
- [ ] Verify console has no errors

### Backend Testing
```bash
# Test API endpoint
curl -X POST http://localhost:5000/api/health/predict \
  -H "Content-Type: application/json" \
  -d '{"age": 55, "bp": 150, "sugar": 160, "heartRate": 95}'
```

### Manual Test Checklist
- [ ] Form submission works
- [ ] API responds correctly
- [ ] Data persists to localStorage
- [ ] Charts render properly
- [ ] Export functionality works
- [ ] No console errors
- [ ] No broken links
- [ ] No dead code

---

## Code Review Process

**Reviewers will check for:**
1. ✅ Code follows style guidelines
2. ✅ Tests are included (where applicable)
3. ✅ Documentation is updated
4. ✅ No breaking changes
5. ✅ Performance implications considered
6. ✅ Security best practices followed
7. ✅ Code quality maintained

**Please allow 1-2 weeks for review.**

---

## Getting Help

- **Questions?** Open a discussion in GitHub Discussions
- **Stuck?** Comment on the issue for help
- **Ideas?** Start a discussion before implementing
- **Questions about code?** Check ARCHITECTURE.md

---

## Recognition

Contributors will be recognized in:
- README.md Contributors section
- GitHub Contributors graph
- Release notes

---

## Legal

By contributing, you agree that:
- Your contributions will be licensed under the same license as the project
- You have the right to contribute the code
- You are not violating any copyright or patents

---

Thank you for contributing to make health assessment more accessible! 🚀

---

**Last Updated**: April 2, 2026
**Status**: Active & Welcoming Contributors
