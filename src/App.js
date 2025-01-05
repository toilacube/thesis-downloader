import React, { useState, useEffect } from "react";
import { Table, Input, Button } from "antd";
import axios from "axios";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const { Search } = Input;

const App = () => {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [downloadLoading, setDownloadLoading] = useState(null); // Loading state for individual downloads
  const [downloadError, setDownloadError] = useState(null); // Track download errors
  const [isDownloadCancelled, setIsDownloadCancelled] = useState(false); // Track download cancel
  const [abortController, setAbortController] = useState(null); // Controller for aborting download

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

  const handleSearch = (value) => {
    const filtered = data.filter((item) =>
      item.title.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredData(filtered);
  };

  const downloadFile = async (item) => {
    setDownloadLoading(item.key); // Set loading for the specific button
    setDownloadError(null);
    setIsDownloadCancelled(false);
    const urlTemplate = item.url;
    const outputFilename = item.key.slice(-5) + ".pdf";
    const controller = new AbortController();
    setAbortController(controller);

    try {
      const response = await axios.post(
        "https://thesis-downloader.onrender.com/create-pdf",
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
        setDownloadError("Download cancelled by user.");
        toast.warn("Download cancelled by user.");
      } else if (error.code === "ECONNABORTED") {
        setDownloadError("Request timed out after 15 minutes");
        toast.error("Request timed out after 15 minutes.");
      } else {
        setDownloadError("Error downloading file");
        toast.error("Error downloading file.");
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
          style={{ color: "blue", textDecoration: "underline", cursor: "pointer", fontSize: "18px", fontFamily: "Arial" }}
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
            disabled={downloadLoading !== null && downloadLoading !== record.key}
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
      <ToastContainer position="top-right" autoClose={1000} />
      <h1 style={{ color: "red", textAlign: "center" }}>UIT Thesis Downloader</h1>
      <div style={{ color: "red", textAlign: "center" }}> Tải 1 file mất tầm 5-10ph nhé piu pồ, server có 500mb ram thôi, tự tải source code về mà chạy cho lẹ</div>
      <Search
        placeholder="Search by title"
        allowClear
        onSearch={handleSearch}
        style={{ marginBottom: "20px", width: "300px" }}
      />
          <div style={{ marginBottom: "20px", fontWeight: "bold" }}>
        Total: {filteredData.length}
      </div>
      {downloadError && <p style={{ color: "red" }}>{downloadError}</p>} {/* Display download error */}
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
      <div style={{
        bottom: "20px",
        right: "20px",
        fontSize: "16px",
        fontWeight: "bold",
        color: "#555"
      }}>
        made by toilacube
      </div>
    </div>
  );
};

export default App;
