const formElement=document.querySelector(".form-container")
const secondBoxElement=document.querySelector(".box2")
const statusElement=document.querySelector(".field-control-filter")
const jobs = [];

const savedJobs=localStorage.getItem("jobs")
if(savedJobs){
    jobs.push(...JSON.parse(savedJobs))
    filterJobs(savedJobs)
}
formElement.addEventListener("submit",(event)=>{
    event.preventDefault()
    const formData=new FormData(formElement)
    const formattedData=Object.fromEntries(formData)
    jobs.push(formattedData)
    localStorage.setItem("jobs",JSON.stringify(jobs))
    filterJobs(jobs)
    formElement.reset();
})


function isEmpty(){
    if(secondBoxElement.children.length === 0){
    const newParagraphElement=document.createElement("p")
    newParagraphElement.textContent="No applications for the work were submitted yet."
    newParagraphElement.classList.add("no-jobs-paragraph")
    secondBoxElement.insertAdjacentElement("afterbegin",newParagraphElement)
}
}
function filterJobs(){
    let filteredJobs=[]
    if (statusElement.value=="all"){
        renderElements(jobs)
    }
    else{
        let filteredJobs = jobs.filter(job => job.status.toLowerCase() === statusElement.value.toLowerCase());
        console.log(filteredJobs)
        renderElements(filteredJobs)
    }
    if (filteredJobs.length === 0) {
        isEmpty();
    }
}

statusElement.addEventListener("change",()=>{
    filterJobs()
})



function renderElements(jobs){
    const noJobsText = document.querySelector(".no-jobs-paragraph");
    if (noJobsText) {
        noJobsText.remove();
    }
    secondBoxElement.innerHTML = "";
    if (jobs.length === 0) {
        isEmpty();
        return;
    }
    const jobTable = document.createElement("table");
    jobTable.classList.add("job-table");
    jobTable.innerHTML = `
                <tr>
                    <th>Company</th>
                    <th>Position</th>
                    <th>Date</th>
                    <th>Status</th>
                </tr>
            `
    jobs.forEach((job) => {
        jobTable.innerHTML += `
                <tr>
                    <td>${job.company}</td>
                    <td>${job.position}</td>
                    <td>${job.date}</td>
                    <td class="${job.status.toLowerCase()}">${job.status}</td>
                    <td style="text-align:right;">
                        <img src="icons8-delete.svg" class="delete-icon">
                        <img src="icons8-edit.svg" class="edit-icon">
                    </td>
                </tr>
        `;

    });
    secondBoxElement.appendChild(jobTable);

}

secondBoxElement.addEventListener("click",(event)=>{
    if(event.target.classList.contains("delete-icon")){
        const row=event.target.closest("tr")
        const index = row.rowIndex - 1;
        jobs.splice(index, 1);
        localStorage.setItem("jobs", JSON.stringify(jobs));
        filterJobs()
        isEmpty()
    }
})

secondBoxElement.addEventListener("click",(event)=>{
    if(event.target.classList.contains("edit-icon")){
        const row=event.target.closest("tr")
        const index = row.rowIndex - 1;
        const job = jobs[index];

        row.innerHTML=`
            <td><input value="${job.company}" class="edit-company"></td>
            <td><input value="${job.position}" class="edit-position"></td>
            <td><input value="${job.date}" type="date" class="edit-date"></td>
            <td class="${job.status.toLowerCase()}">
            <select class="edit-status">
                    <option value="pending" ${job.status === "pending" ? "selected" : ""}>Pending</option>
                    <option value="interview" ${job.status === "interview" ? "selected" : ""}>Interview</option>
                    <option value="rejected" ${job.status === "rejected" ? "selected" : ""}>Rejected</option>
            </select>
            </td>
            <td>
                <img src="icons8-speichern-16.png" class="save-edit-btn">
            </td>
        `
    }
})

secondBoxElement.addEventListener("click",(event)=>{
    if(event.target.closest(".save-edit-btn")){
        const currentRow=event.target.closest("tr")
        const index = currentRow.rowIndex - 1;

        jobs[index] = {
            company: currentRow.querySelector(".edit-company").value,
            position: currentRow.querySelector(".edit-position").value,
            date: currentRow.querySelector(".edit-date").value,
            status: currentRow.querySelector(".edit-status").value
        };
        localStorage.setItem("jobs", JSON.stringify(jobs));
        filterJobs();
    }
})
app.get("/export", (req, res) => {
    const query = 'SELECT * FROM guests';
    conn.query(query, (err, guests) => {
        if (err) {
            return res.status(500).send('Ошибка получения данных');
        }

        const doc = new PDFDocument({ margin: 40 });
        const filename = `guests_${Date.now()}.pdf`;
        const filepath = path.join(__dirname, filename);

        const now = new Date();
        const dateString = now.toLocaleDateString();
        const timeString = now.toLocaleTimeString();
        const exportInfo = `Exported on ${dateString} ${timeString}`;

        doc.pipe(fs.createWriteStream(filepath));

        // Заголовок
        doc.fontSize(20).text('Guest Book Export', { align: 'center' });
        doc.moveDown();
        doc.fontSize(10).text(exportInfo, { align: 'center' });
        doc.moveDown(2);

        // Заголовки таблицы
        const headers = ['Full Name', 'Email', 'Country', 'Check-in', 'Check-out', 'Room Type', 'Room #'];
        const colWidths = [100, 140, 70, 70, 70, 70, 50];
        const startX = doc.page.margins.left;
        let startY = doc.y;

        doc.font('Helvetica-Bold');
        headers.forEach((header, i) => {
            doc.text(header, startX + colWidths.slice(0, i).reduce((a, b) => a + b, 0), startY, { width: colWidths[i] });
        });

        startY += 20;
        doc.moveTo(startX, startY - 5).lineTo(startX + colWidths.reduce((a, b) => a + b, 0), startY - 5).stroke();
        doc.font('Helvetica');

        // Данные
        guests.forEach((guest) => {
            const row = [
                guest.full_name,
                guest.email || '-',
                guest.country,
                guest.check_in.toISOString().split('T')[0],
                guest.check_out.toISOString().split('T')[0],
                guest.room_type,
                String(guest.room_number)
            ];

            row.forEach((text, i) => {
                doc.text(text, startX + colWidths.slice(0, i).reduce((a, b) => a + b, 0), startY, {
                    width: colWidths[i],
                    ellipsis: true
                });
            });

            startY += 20;
            if (startY > doc.page.height - 50) {
                doc.addPage();
                startY = doc.page.margins.top;
            }
        });

        doc.end();

        doc.on("finish", () => {
            res.download(filepath, filename, (err) => {
                if (err) console.log(err);
                fs.unlink(filepath, () => {});
            });
        });
    });
});
