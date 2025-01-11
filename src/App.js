import React, { useState, useEffect } from "react";
import { Table, Input, Button, Switch, Typography } from "antd";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Markdown from "react-markdown";

const { Search } = Input;

const App = () => {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [downloadLoading, setDownloadLoading] = useState(null); // Loading state for individual downloads
  const [isDownloadCancelled, setIsDownloadCancelled] = useState(false); // Track download cancel
  const [abortController, setAbortController] = useState(null); // Controller for aborting download

  const localHost = "http://localhost:5000";
  const serverHost = "https://thesis-downloader.onrender.com";
  const [host, setHost] = useState(serverHost);


  const instructions = `
\`\`\`bash
    docker pull toilacube/thesis-downloader:latest 

    docker run -p 5000:5000  toilacube/thesis-downloader:latest
\`\`\`
  `;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(
          "https://res.cloudinary.com/dt6ag4u38/raw/upload/v1736011070/data_aguht0.json"
        );
        setData(response.data);
        setFilteredData(response.data); // Initialize filteredData
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);

  const hanleChangeHost = (checked) => {
    if (checked) {
      setHost(localHost);
      toast.info("Switched to local mode, running on port 5000");
    } else {
      setHost("https://thesis-downloader.onrender.com");
      toast.info("Switched to server mode, running on Render");
    }
  };

  const handleSearch = (value) => {
    const filtered = data.filter((item) =>
      item.title.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredData(filtered);
  };

  const downloadFile = async (item) => {
    setDownloadLoading(item.key); // Set loading for the specific button
    setIsDownloadCancelled(false);
    const urlTemplate = item.url;
    const outputFilename = item.key.slice(-5) + ".pdf";
    const controller = new AbortController();
    setAbortController(controller);

    try {
      const response = await axios.post(
        `${host}/create-pdf`,
        {
          url_template: urlTemplate,
          output_filename: outputFilename,
        },
        {
          responseType: "blob",
          timeout: 15 * 60 * 1000,
          signal: controller.signal,
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = outputFilename;
      document.body.appendChild(a);
      a.click();

      a.remove();
      window.URL.revokeObjectURL(url);

      toast.success("Download completed successfully!");
    } catch (error) {
      if (axios.isCancel(error)) {
        toast.warn("Download cancelled by user.");
      } else if (error.code === "ECONNABORTED") {
        toast.error("Request timed out after 15 minutes.");
      } else {
        if (host === localHost)
        toast.error("Error downloading file. Please make sure the local server is running on port 5000");
      }
    } finally {
      setDownloadLoading(null); // Reset loading state
    }
  };

  const cancelDownload = () => {
    if (abortController) {
      abortController.abort(); // Cancel the request
      setIsDownloadCancelled(true);
    }
  };

  const columns = [
    {
      title: "ID",
      key: "id",
      render: (text, record, index) => index + 1, // Display row index as ID
    },
    {
      title: "Title",
      dataIndex: "title",
      key: "title",
      render: (text, record) => (
        <a
          href={record.key}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: "blue",
            textDecoration: "underline",
            cursor: "pointer",
            fontSize: "18px",
            fontFamily: "Arial",
          }}
        >
          {text}
        </a>
      ),
      sorter: (a, b) => a.title.localeCompare(b.title), // Make this column sortable
    },
    {
      title: "Year",
      dataIndex: "year",
      key: "year",
      sorter: (a, b) => a.year.localeCompare(b.year), // Sort by year
    },
    {
      title: "Download",
      key: "download",
      render: (text, record) => (
        <div>
          <Button
            type="primary"
            onClick={() => downloadFile(record)}
            loading={downloadLoading === record.key}
            disabled={
              downloadLoading !== null && downloadLoading !== record.key
            }
          >
            Download
          </Button>
          <Button
            type="danger"
            onClick={cancelDownload}
            disabled={downloadLoading !== record.key || isDownloadCancelled}
            style={{ marginLeft: "10px" }}
          >
            Cancel
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div style={{ padding: "20px" }}>
      <ToastContainer position="top-right" autoClose={3000} />
      <h1
        style={{
          color: "#d32f2f",
          textAlign: "center",
          marginBottom: "10px",
          fontSize: "48px",
        }}
      >
        UIT Thesis Downloader
      </h1>
      {/* Subheader */}
      <p
        style={{
          color: "#d32f2f",
          textAlign: "center",
          fontSize: "14px",
          marginBottom: "20px",
        }}
      >
        Tải 1 file mất tầm 5-10 phút nhé piu pồ, server có 500MB RAM thôi!
      </p>
      {/* Instructions and Switch */}
      <div
        style={{
          textAlign: "center",
          maxWidth: "600px",
          margin: "0 auto",
          padding: "20px",
          backgroundColor: "#f9f9f9",
          border: "1px solid #ddd",
          borderRadius: "8px",
        }}
      >
        <p
          style={{ marginBottom: "15px", fontSize: "16px", fontWeight: "bold" }}
        >
          Chạy cái image này rồi bật mode local lên để tải file bằng local cho
          lẹ cho tiện
        </p>

        {/* Markdown instructions */}
        <div
          style={{
            textAlign: "left",
            backgroundColor: "#fff",
            padding: "10px 15px",
            border: "1px solid #ddd",
            borderRadius: "6px",
            marginBottom: "20px",
            fontSize: "14px",
          }}
        >
          <Markdown>{instructions}</Markdown>
        </div>

        {/* Switch */}
        <Switch
          checkedChildren="Local"
          unCheckedChildren="Server"
          onChange={hanleChangeHost}
        />
      </div>
      <Search
        placeholder="Search by title"
        allowClear
        onSearch={handleSearch}
        style={{ marginBottom: "20px", width: "300px" }}
      />
      <div style={{ marginBottom: "20px", fontWeight: "bold" }}>
        Total: {filteredData.length}
      </div>
      {/* Display download error */}
      <Table
        columns={columns}
        dataSource={filteredData} // Use filteredData for rendering
        rowKey="key"
        pagination={{
          defaultPageSize: 50,
          showSizeChanger: true,
          position: ["bottomCenter", "topCenter"],
          pageSizeOptions: ["10", "20", "50"],
        }}
        bordered
      />
      <div
        style={{
          bottom: "20px",
          right: "20px",
          fontSize: "16px",
          fontWeight: "bold",
          color: "#555",
        }}
      >
        made by toilacube
      </div>
    </div>
  );
};

export default App;
