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

* **Live Deployment Website:** https://jeroentenorio930.github.io/binary-64bit-floating-point-machine/
* **YouTube Video Walkthrough (5-8 mins):** https://www.youtube.com/watch?v=-h_PS-4w8Yc

---

## 👥 Team Members (Group 4)

* **Allen Conner Hizon** - GUI and Backend Development
* **Charles Sebastian Infante** - Video Recording
* **Jose Miguel Marquez** - Flags Bonus Feature
* **Justin John Sy** - Video Editing
* **Jeroen Ralph Tenorio** - Arithmetic and Conversion Logic

---

## ✅ Core Specifications & Task Tracker

### 1. Decimal to Binary Double-Precision Conversion

* [/] Take a decimal number as input.
* [/] Output the IEEE 754 double-precision representation (including special cases like NaN, Infinity).
* [/] Display output in Binary with proper spacing.
* [/] Display output in Hexadecimal.

### 2. Rounding Methods

* [/] Accept a number in either decimal or binary format as input.
* [/] Accept a target number of digits (or bits) for rounding.
* [/] Output rounded result using **Chopping**.
* [/] Output rounded result using **Round-up**.
* [/] Output rounded result using **Round-down**.
* [/] Output rounded result using **Round-to-nearest ties-to-even**.

### 3. Arithmetic Operations (Addition & Multiplication)

* [/] Accept operands in either decimal or IEEE hexadecimal format.
* [/]  Accept the type of operation: Addition or Multiplication.
* [/] Implement the **GRS (Guard, Round, Sticky)** method for operations.
* [/] Output the step-by-step solution.
* [/] Output the final result (including special cases) in Binary with proper spacing.
* [/] Output the final result in Hexadecimal.
* [/] Output the final result in Decimal.

### 🌟 4. Additional Features (For the 90-Point Tier)

* [/] **Reverse Conversion:** Added functionality to convert an IEEE 754 double-precision input (Binary or Hexadecimal) back into a Decimal format.
* [/] **Flag Visualization:** Added functionality to display and explain the flags set according to the IEEE 754 64-bit floating-point standard (https://faculty.cc.gatech.edu/~hyesoon/spr09/ieee754.pdf)

These **two** features go well beyond the original scope outlined in the specs.

---

## 📦 Deliverables Checklist

Before final submission, ensure all of the following are complete and stored in this repository:

* [/] **Web-based GUI:** Built and functioning perfectly.
* [/] **Public Repository Access:** Repo is set to public OR the instructor is granted access.
* [/] **Source Code:** Complete and well-commented.
* [/] **Analysis Write-up:** Included in this README (See Section Below).
* [/] **Screenshots Folder:** Contains captures of the program output for all possible test cases (normal, special, edge, different inputs).
* [/] **Video Walkthrough:** 5 to 8-minute YouTube video demonstrating the system, proving correctness, and showing all test cases. Link added to README.
* [/] **Deployment Link:** App is deployed live, and the link is in the GitHub "About" section.
* [/] **Prepared for Live Demo:** Team is ready for a face-to-face or Zoom demo if required by the instructor.

---

## 📊 Analysis Write-Up

Our primary design choice for the website was making it similar to that of our interactive virtual exhibit for case study 2. We liked the design and found it easy to reuse for this kind of project since they're pretty similar in terms of tech stack and objectives. Our GRS (Guard, Round, Sticky) implementation performs single-step IEEE 754 Round-to-Nearest, Ties-to-Even rounding directly on full-precision intermediate bit fields (55-bit mantissas for addition, 105-bit products for multiplication).

The Guard (G) bit is the first bit immediately past the target 52-bit fraction, the Round (R) bit is the second, and the Sticky (S) bit is the logical OR of all remaining lower-order bits (including any bits shifted out during operand alignment). One key thing we took into account was that if the result is subnormal, the required denormalization shift is incorporated into the total dropped bit count so that GRS extraction and ties-to-even rounding occur in a single atomic step. This prevents the double-rounding errors that plagued the initial design before we did our testing.

Our primary challenges were from the implementation of the floating-point exception flags, one of our two main bonus features added on top of the existing requirements for full points, the other being reverse conversion of a hex/binary IEEE 754 encoding. The flags gave us a lot of trouble, we had to keep double checking the specs we based them on, and had to run a ton of testing, both automated and manual, to try and cover every edge case with the different arithmetic operations, conversions, and roundings.

These features help enhance the user experience by showing them that the CPU designers took into account all of the possible edge cases and weirdness that could happen when designing IEEE 754 floats. Things like underflows, overflows, and numbers not being exactly representable were all accounted for, and the flags help programmers decide how to handle these occurrences. Our other bonus feature, reverse conversion, perfectly complements the existing decimal to IEEE 754 conversion by providing an easy way to do the opposite. That way, users can double check their answers when practicing conversions, and better understand how the conversion process works by looking at both sides.  

---

## Video Demonstration

https://www.youtube.com/watch?v=-h_PS-4w8Yc

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