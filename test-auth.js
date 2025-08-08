const fetch = require('node-fetch');

async function testAuth() {
    const baseUrl = 'http://localhost:3000';
    
    console.log('Testing VITALAÉ Authentication...\n');
    
    // Test 1: Register a new user
    console.log('1. Testing User Registration...');
    try {
        const registerResponse = await fetch(`${baseUrl}/api/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: 'Test User',
                email: 'test@vitalae.com',
                password: 'password123'
            })
        });
        
        const registerData = await registerResponse.json();
        console.log('Registration Response:', registerData);
        
        if (registerResponse.ok) {
            console.log('✅ Registration successful!\n');
            
            // Test 2: Login with the registered user
            console.log('2. Testing User Login...');
            const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: 'test@vitalae.com',
                    password: 'password123'
                })
            });
            
            const loginData = await loginResponse.json();
            console.log('Login Response:', loginData);
            
            if (loginResponse.ok) {
                console.log('✅ Login successful!\n');
                
                // Test 3: Check if user exists (duplicate registration)
                console.log('3. Testing Duplicate Registration...');
                const duplicateResponse = await fetch(`${baseUrl}/api/auth/register`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        name: 'Test User 2',
                        email: 'test@vitalae.com',
                        password: 'password456'
                    })
                });
                
                const duplicateData = await duplicateResponse.json();
                console.log('Duplicate Registration Response:', duplicateData);
                
                if (!duplicateResponse.ok && duplicateData.error === 'User already exists') {
                    console.log('✅ Duplicate registration properly blocked!\n');
                }
                
                // Test 4: Check debug endpoint
                console.log('4. Checking Debug Endpoint...');
                const debugResponse = await fetch(`${baseUrl}/api/debug/users`);
                const debugData = await debugResponse.json();
                console.log('Debug Response:', debugData);
                console.log('✅ Debug endpoint working!\n');
                
            } else {
                console.log('❌ Login failed!');
            }
        } else {
            console.log('❌ Registration failed!');
        }
        
    } catch (error) {
        console.error('❌ Test failed with error:', error.message);
    }
}

testAuth();
