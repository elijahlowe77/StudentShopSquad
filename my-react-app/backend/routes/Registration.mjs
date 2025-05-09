/**
 * Registration Route Handler
 * 
 * This module handles user registration and availability checks including:
 * - New user registration with validation
 * - Username availability check
 * - Email availability check
 */

import { Router } from "express";
import { body, validationResult } from "express-validator";
import { user } from "../mongoose/user.mjs";
import { hashPassword } from "../utils/helpers.mjs"; 

const router = Router();

/**
 * POST /api/register
 * Registers a new user in the system
 * 
 * Request Body:
 * - username: string - Must be at least 3 characters
 * - password: string - Must be at least 3 characters
 * - email: string - Must be a valid email address
 * 
 * Returns:
 * - 201: Success response with user object
 * - 400: Validation errors or username/email already exists
 * - 500: Server error message
 */
router.post('/api/register', 
    body("username")
        .notEmpty().withMessage("Username is required")
        .isLength({ min: 3 }).withMessage("Username must be at least 3 characters long"),
    body("password")
        .notEmpty().withMessage("Password is required")
        .isLength({ min: 3 }).withMessage("Password must be at least 3 characters long"),
    body("email")
        .notEmpty().withMessage("Email is required")
        .isEmail().withMessage("Must be a valid email address"),
    async (request, response) => {
        console.log('Registration attempt received:', {
            ...request.body,
            password: request.body.password
        });

        // Validate input data
        const result = validationResult(request);
        if (!result.isEmpty()) {
            console.log('Validation errors:', result.array());
            return response.status(400);
        }

        let { username, password, email } = request.body;

        try {
            // Check username availability
            const userExists = await user.findOne({ username });
            if (userExists) {
                console.log('Username already exists please try again');
                return response.status(400).json({ 
                    message: "Username taken" 
                });
            }

            // Check email availability
            const emailExists = await user.findOne({ email });
            if (emailExists) {
                console.log('Email already exists please try again');
                return response.status(400).json({ 
                    message: "Email previously registered" 
                });
            }

            // Hash password for security
            password = hashPassword(password); 
            console.log(password);
            
            // Create new user document
            const newUser = new user({
                username,
                password, 
                email
            });

            // Save user to database
            const savedUser = await newUser.save();
            console.log('New user registered:', savedUser.username);

            // Create session for new user
            request.session.user = newUser;

            return response.status(201).json({
                message: "Registration successful",
                user: newUser
            });

        } catch (error) {
            console.error("Registration error:", error);
            return response.status(500).json({ 
                message: "Error creating user account" 
            });
        }
    }
);

/**
 * GET /api/register/usercheck/:username
 * Checks if a username is available
 * 
 * Parameters:
 * - username: string - Username to check
 * 
 * Returns:
 * - 200: { available: boolean }
 * - 500: Error message if check fails
 */
router.get('/api/register/usercheck/:username', 
    async (request, response) => {
        try {
            const existingUser = await user.findOne({ 
                username: request.params.username 
            });
            
            return response.json({ 
                available: !existingUser 
            });
        } catch (error) {
            console.error("Username check error:", error);
            return response.status(500).json({ 
                message: "Error checking when searching username check" 
            });
        }
    }
);

/**
 * GET /api/register/emailcheck/:email
 * Checks if an email is available
 * 
 * Parameters:
 * - email: string - Email to check
 * 
 * Returns:
 * - 200: { available: boolean }
 * - 500: Error message if check fails
 */
router.get('/api/register/emailcheck/:email', 
    async (request, response) => {
        try {
            const existingEmail = await user.findOne({ 
                email: request.params.email 
            });
            
            return response.json({ 
                available: !existingEmail 
            });
        } catch (error) {
            console.error("Email check error:", error);
            return response.status(500).json({ 
                message: "Error checking email availability" 
            });
        }
    }
);

export default router; 