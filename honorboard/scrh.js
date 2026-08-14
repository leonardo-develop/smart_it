let allUsers = []; 
async function loadBoard() {
    try {
        const res = await fetch("/api/leaderboard"); 
        if (!res.ok) throw new Error("Failed to fetch");

        allUsers = await res.json();
        displayData(allUsers); 
    } catch (error) {
        console.error("Error loading board:", error);
    }
}

function displayData(data) {
    
    const tables = {
        "Software Engineering": document.getElementById("se-students"),
        "Computer Science": document.getElementById("cs-students"),
        "Data Science and AI": document.getElementById("ai-students"),
        "Information Systems": document.getElementById("cis-students"),
        "Cybersecurity": document.getElementById("cyber-students")
    };
  
    Object.values(tables).forEach(tbody => {
        if (tbody) tbody.innerHTML = "";
    });


    data.forEach(user => {
        const tbody = tables[user.department];
        if (tbody) {
          
            const rowCount = tbody.rows.length; 
            const row = `
                <tr>
                    <td>${rowCount + 1}</td>
                    <td>${user.name}</td>
                    <td>${user.hours}</td> 
                    <td class="grade">${parseFloat(user.score).toFixed(2)}%</td>
                </tr>
            `;
            tbody.innerHTML += row;
        }
    });
}
const searchInput = document.getElementById("searchInput");
if (searchInput) {
    searchInput.addEventListener("input", (e) => {
        const text = e.target.value.toLowerCase();
        const filtered = allUsers.filter(user => {
            return user.name.toLowerCase().includes(text) || 
                   user.department.toLowerCase().includes(text);
        });
        displayData(filtered); 
    });
}

document.addEventListener("DOMContentLoaded", loadBoard);