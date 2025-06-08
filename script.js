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

document.getElementById("export-btn").addEventListener("click", () => {
    if (jobs.length === 0) {
        alert("No jobs to export.");
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    const tableData = jobs.map(job => [
        job.company,
        job.position,
        job.date,
        job.status
    ]);

    doc.text("Job Applications", 14, 15);
    doc.autoTable({
        head: [["Company", "Position", "Date", "Status"]],
        body: tableData,
        startY: 20
    });

    doc.save("job-applications.pdf");
});
