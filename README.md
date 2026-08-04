# CSARCH2 Simulation Project - Group 4

## 💻 Project Description
This repository contains our web-based Graphical User Interface (GUI) application for **Machine 3: Binary 64-bit Floating-Point Machine**. 

The application simulates IEEE 754 binary double-precision operations, specifically focusing on conversion, rounding methods, and arithmetic operations (Addition and Multiplication) using the GRS (Guard, Round, Sticky) method.

### Target Score: Exemplary (90/90)
To achieve the maximum score based on the grading rubric, this project must:
* Be working perfectly with all specifications followed.
* Have correct outputs for all test cases (normal, special, edge cases).
* Include all required deliverables submitted properly.
* **Include additional features** beyond the base specifications.

---

## 🔗 Important Links
* **Live Deployment Website:** [Insert Deployment Link Here] 
*(Note: The deployment link must also be added to the "About" / "Website" section of this GitHub repository*
* **YouTube Video Walkthrough (5-8 mins):** [Insert YouTube Link Here]

---

## 👥 Team Members (Group 4)
* **[Member 1 Name]** - [Role/Tasks, e.g., GUI Development]
* **[Member 2 Name]** - [Role/Tasks, e.g., IEEE 754 Conversion Logic]
* **[Member 3 Name]** - [Role/Tasks, e.g., GRS Arithmetic Logic]
* **[Member 4 Name]** - [Role/Tasks, e.g., QA, Testing & Video Demo]

---

## ✅ Core Specifications & Task Tracker

### 1. Decimal to Binary Double-Precision Conversion
- [/] Take a decimal number as input.
- [/] Output the IEEE 754 double-precision representation (including special cases like NaN, Infinity).
- [/] Display output in Binary with proper spacing.
- [/] Display output in Hexadecimal.

### 2. Rounding Methods
- [/] Accept a number in either decimal or binary format as input.
- [/] Accept a target number of digits (or bits) for rounding.
- [/] Output rounded result using **Chopping**.
- [/] Output rounded result using **Round-up**.
- [/] Output rounded result using **Round-down**.
- [/] Output rounded result using **Round-to-nearest ties-to-even**.

### 3. Arithmetic Operations (Addition & Multiplication)
- [ ] Accept operands in either decimal or IEEE hexadecimal format.
- [ ] Accept the type of operation: Addition or Multiplication.
- [ ] Implement the **GRS (Guard, Round, Sticky)** method for operations.
- [ ] Output the step-by-step solution.
- [ ] Output the final result (including special cases) in Binary with proper spacing.
- [ ] Output the final result in Hexadecimal.
- [ ] Output the final result in Decimal.

### 🌟 4. Additional Features (For the 90-Point Tier)
*(Brainstorm and check off 1-2 extra features here to secure the perfect score)*
- [/] **Reverse Conversion:** Added functionality to convert an IEEE 754 double-precision input (Binary or Hexadecimal) back into a Decimal format.
- [/] **Flag Visualizaiton:** Added functionality to display and explain the flags set according to the IEEE 754 64-bit floating-point standard (https://faculty.cc.gatech.edu/~hyesoon/spr09/ieee754.pdf)
---

## 📦 Deliverables Checklist

Before final submission, ensure all of the following are complete and stored in this repository:

- [ ] **Web-based GUI:** Built and functioning perfectly.
- [ ] **Public Repository Access:** Repo is set to public OR the instructor is granted access.
- [ ] **Source Code:** Complete and well-commented.
- [ ] **Analysis Write-up:** Included in this README (See Section Below).
- [ ] **Screenshots Folder:** Contains captures of the program output for all possible test cases (normal, special, edge, different inputs).
- [ ] **Video Walkthrough:** 5 to 8-minute YouTube video demonstrating the system, proving correctness, and showing all test cases. Link added to README.
- [ ] **Deployment Link:** App is deployed live, and the link is in the GitHub "About" section.
- [ ] **Prepared for Live Demo:** Team is ready for a face-to-face or Zoom demo if required by the instructor.

---

## 📊 Analysis Write-Up
*(Group 4: Write your project analysis here. Briefly explain your design choices, how you implemented the GRS method, the challenges you faced handling 64-bit precision, and how your additional features enhance the user experience.)*

* Write-up paragraph 1...
* Write-up paragraph 2...

---

## 🛠️ Local Development Setup
This project was built using **React** and **TypeScript**, scaffolded with **Vite**. To run the application locally on your machine, follow these steps:

1. Clone the repository: 
  ```bash
  git clone [repository link]
  ```

2. Navigate to the project directory:
  ```
  cd [project folder name]
  ```

3. Install the required Node.js dependencies:
  ```
  npm install 
  ```

4. Start the local Vite development server:
  ```
  npm run dev
  ```