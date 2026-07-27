# CSARCH2 Simulation Project - Group 4

## 💻 Project Description
This repository contains our web-based Graphical User Interface (GUI) application for **Machine 3: Binary 64-bit Floating-Point Machine**[cite: 1]. 

The application simulates IEEE 754 binary double-precision operations, specifically focusing on conversion, rounding methods, and arithmetic operations (Addition and Multiplication) using the GRS (Guard, Round, Sticky) method[cite: 1].

### Target Score: Exemplary (90/90)
To achieve the maximum score based on the grading rubric, this project must:
* Be working perfectly with all specifications followed.
* Have correct outputs for all test cases (normal, special, edge cases).
* Include all required deliverables submitted properly.
* **Include additional features** beyond the base specifications.

---

## 🔗 Important Links
* **Live Deployment Website:** [Insert Deployment Link Here] 
*(Note: The deployment link must also be added to the "About" / "Website" section of this GitHub repository[cite: 1])*
* **YouTube Video Walkthrough (5-8 mins):** [Insert YouTube Link Here]

---

## 👥 Team Members (Group 4)
* **[Member 1 Name]** - [Role/Tasks, e.g., GUI Development]
* **[Member 2 Name]** - [Role/Tasks, e.g., IEEE 754 Conversion Logic]
* **[Member 3 Name]** - [Role/Tasks, e.g., GRS Arithmetic Logic]
* **[Member 4 Name]** - [Role/Tasks, e.g., QA, Testing & Video Demo]

---

## ✅ Core Specifications & Task Tracker

### 1. Decimal to Binary Double-Precision Conversion[cite: 1]
- [ ] Take a decimal number as input[cite: 1].
- [ ] Output the IEEE 754 double-precision representation (including special cases like NaN, Infinity)[cite: 1].
- [ ] Display output in Binary with proper spacing[cite: 1].
- [ ] Display output in Hexadecimal[cite: 1].

### 2. Rounding Methods[cite: 1]
- [ ] Accept a number in either decimal or binary format as input[cite: 1].
- [ ] Accept a target number of digits (or bits) for rounding[cite: 1].
- [ ] Output rounded result using **Chopping**[cite: 1].
- [ ] Output rounded result using **Round-up**[cite: 1].
- [ ] Output rounded result using **Round-down**[cite: 1].
- [ ] Output rounded result using **Round-to-nearest ties-to-even**[cite: 1].

### 3. Arithmetic Operations (Addition & Multiplication)[cite: 1]
- [ ] Accept operands in either decimal or IEEE hexadecimal format[cite: 1].
- [ ] Accept the type of operation: Addition or Multiplication[cite: 1].
- [ ] Implement the **GRS (Guard, Round, Sticky)** method for operations[cite: 1].
- [ ] Output the step-by-step solution[cite: 1].
- [ ] Output the final result (including special cases) in Binary with proper spacing[cite: 1].
- [ ] Output the final result in Hexadecimal[cite: 1].
- [ ] Output the final result in Decimal[cite: 1].

### 🌟 4. Additional Features (For the 90-Point Tier)
*(Brainstorm and check off 1-2 extra features here to secure the perfect score)*
- [ ] E.g., Export step-by-step solution to PDF/TXT.
- [ ] E.g., Operation history log.
- [ ] E.g., Dark/Light mode toggle.

---

## 📦 Deliverables Checklist

Before final submission, ensure all of the following are complete and stored in this repository:

- [ ] **Web-based GUI:** Built and functioning perfectly[cite: 1].
- [ ] **Public Repository Access:** Repo is set to public OR the instructor is granted access[cite: 1].
- [ ] **Source Code:** Complete and well-commented[cite: 1].
- [ ] **Analysis Write-up:** Included in this README (See Section Below)[cite: 1].
- [ ] **Screenshots Folder:** Contains captures of the program output for all possible test cases (normal, special, edge, different inputs)[cite: 1].
- [ ] **Video Walkthrough:** 5 to 8-minute YouTube video demonstrating the system, proving correctness, and showing all test cases[cite: 1]. Link added to README[cite: 1].
- [ ] **Deployment Link:** App is deployed live, and the link is in the GitHub "About" section[cite: 1].
- [ ] **Prepared for Live Demo:** Team is ready for a face-to-face or Zoom demo if required by the instructor[cite: 1].

---

## 📊 Analysis Write-Up
*(Group 4: Write your project analysis here. Briefly explain your design choices, how you implemented the GRS method, the challenges you faced handling 64-bit precision, and how your additional features enhance the user experience.)*

* Write-up paragraph 1...
* Write-up paragraph 2...

---

## 🛠️ Local Development Setup
*(Instructions for the instructor or other developers on how to run your project locally)*

1. Clone the repository: `git clone [repository link]`
2. Navigate to the project directory: `cd [project folder]`
3. Install dependencies: `npm install` *(change if using python/pip, etc.)*
4. Run the development server: `npm run dev`
5. Open `http://localhost:3000` in your browser.
