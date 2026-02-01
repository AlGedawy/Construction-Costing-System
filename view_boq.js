
function viewBOQ() {
    document.getElementById('main-content').innerHTML = `
        <h2>BOQ Table</h2>
        <table border="1" width="100%">
            <tr><th>Item</th><th>Quantity</th><th>Unit</th><th>Rate</th><th>Total</th></tr>
            <tr><td>Excavation</td><td>100</td><td>m³</td><td>50</td><td>5000</td></tr>
            <tr><td>Concrete</td><td>80</td><td>m³</td><td>120</td><td>9600</td></tr>
        </table>
    `;
}
